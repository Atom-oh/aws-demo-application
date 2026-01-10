# Kong Module Outputs

output "namespace" {
  description = "Kong namespace"
  value       = var.create_namespace ? kubernetes_namespace.kong[0].metadata[0].name : "kong"
}

output "proxy_service_name" {
  description = "Kong proxy service name"
  value       = kubernetes_service.kong_proxy.metadata[0].name
}

output "admin_service_name" {
  description = "Kong admin service name"
  value       = kubernetes_service.kong_admin.metadata[0].name
}

output "service_account_name" {
  description = "Kong service account name"
  value       = kubernetes_service_account.kong.metadata[0].name
}
