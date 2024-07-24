resource "azurerm_resource_group" "myrg" {
  name     = "myrg"
  location = "West Europe"
}


resource "azurerm_storage_account" "mystorage" {
  name                            = "mystorage"
  resource_group_name             = azurerm_resource_group.myrg.name
  location                        = azurerm_resource_group.myrg.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = false
}

resource "azurerm_service_plan" "myappsrvplan" {
  name                = "myappsrvplan"
  location            = azurerm_resource_group.myrg.location
  resource_group_name = azurerm_resource_group.myrg.name
  os_type             = "Linux"
  sku_name            = "P1v3"
}


resource "azurerm_linux_function_app" "myfunctionapp" {
  name                = "myfunctionapp"
  location            = azurerm_resource_group.myrg.location
  resource_group_name = azurerm_resource_group.myrg.name

  storage_account_name          = azurerm_storage_account.mystorage.name
  storage_uses_managed_identity = true
  service_plan_id               = azurerm_service_plan.myappsrvplan.id

  public_network_access_enabled = false
  https_only                    = true

  site_config {
    vnet_route_all_enabled = true
  }
  identity {
    type = "SystemAssigned"
  }
}




resource "random_password" "generapassrandom" {
  length  = 32
  special = true
}

resource "azurerm_mssql_server" "mssql" {
  name                          = "mssql"
  location            = azurerm_resource_group.myrg.location
  resource_group_name = azurerm_resource_group.myrg.name
  administrator_login           = "admin"
  administrator_login_password  = random_password.generapassrandom.result
  minimum_tls_version           = "1.2"
  version                       = "12.0"
  public_network_access_enabled = false
  azuread_administrator {
    login_username = "sql-admins"                       #The login username of the Azure AD Administrator of this SQL Server
    object_id      = "object-id-of-sql-admins-group" #The object id of the Azure AD Administrator of this SQL Server
  }
  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_mssql_database" "mydb" {
  name         = "mydb"
  server_id    = azurerm_mssql_server.mssql.id
  max_size_gb  = 30
  sku_name     = "P1"
  license_type = "LicenseIncluded"
}


resource "azurerm_role_assignment" "role_mssql_to_myfunctionapp" {
  scope                = azurerm_mssql_server.mssql.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_linux_function_app.myfunctionapp.identity[0].principal_id
}


locals{
  query = "CREATE LOGIN [${azurerm_linux_function_app.myfunctionapp.name}] FROM EXTERNAL PROVIDER; ALTER ROLE db_owner ADD MEMBER [${azurerm_linux_function_app.myfunctionapp.name}];"
}

module "launch_query" {
  source = "/run_sql_query"
  ACCESS_TOKEN = var.ACCESS_TOKEN
  sql_database_name = azurerm_mssql_database.mydb.name
  sql_server_name = azurerm_mssql_server.mssql.name
  query_string_to_exec = local.query
  triggerId = local.query
}
