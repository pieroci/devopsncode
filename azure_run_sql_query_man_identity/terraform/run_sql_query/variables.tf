variable "ACCESS_TOKEN" {
  type = string
}

variable "sql_server_name"{
  type = string
}

variable "sql_database_name"{
  type = string
}

variable "query_string_to_exec" {
    type = string
}

variable "triggerId" {
    type = string
    default = ""
}