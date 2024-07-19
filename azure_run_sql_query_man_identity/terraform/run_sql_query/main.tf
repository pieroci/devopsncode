locals {
  unique_suffix = "${random_uuid.randomuuid.result}"
  temp_dir = "${path.module}/temp/${local.unique_suffix}"
  sqlcmdtemplate = templatefile("${path.module}/powershell_templates/sqlcmd.ps1", {
    serverName   = var.sql_server_name,
    databaseName = var.sql_database_name,
    query        = var.query_string_to_exec # local.querytemplate
  })
}

resource "random_uuid" "randomuuid" {
}

resource "local_file" "create_temp_dir" {
  content = ""
  filename = "${local.temp_dir}/.keep"
}
 
resource "local_file" "sqlcommandpshellscript" {
  content  = local.sqlcmdtemplate
  filename = "${local.temp_dir}/sqlcmd.ps1"
  depends_on = [local_file.create_temp_dir]
}
 
resource "null_resource" "database_setup_local_exec" {
  provisioner "local-exec" {
    command = "pwsh -File ./${local_file.sqlcommandpshellscript.filename} -AccessToken ${var.ACCESS_TOKEN}"
    environment = {
      ACCESS_TOKEN = var.ACCESS_TOKEN
    }
  }
  triggers = {
    fileId = var.triggerId # join(",", [local_file.sqlscript.content_md5, local_file.sqlcommandpshellscript.content_md5])
  }
}
    