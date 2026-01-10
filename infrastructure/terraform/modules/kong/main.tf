# =============================================================================
# DEPRECATED: This module has been migrated to ArgoCD GitOps deployment
# =============================================================================
#
# Kong is now deployed via ArgoCD using the official Kong Helm chart.
# See: infrastructure/argocd/applications/kong.yaml
#
# This Terraform module is kept for reference only.
# DO NOT use this module for new deployments.
#
# Migration benefits:
# - GitOps workflow with declarative configuration
# - DB-less mode (no PostgreSQL dependency)
# - Kong Ingress Controller for K8s-native integration
# - Easier plugin management via Kong CRDs
#
# =============================================================================
# Kong API Gateway Module for HireHub (DEPRECATED)
# Deploys Kong on EKS with rate limiting and circuit breaker

locals {
  kong_namespace = "kong"
  common_tags = merge(var.tags, {
    Module = "kong"
  })
}

# Kong Namespace
resource "kubernetes_namespace" "kong" {
  count = var.create_namespace ? 1 : 0

  metadata {
    name = local.kong_namespace
    labels = {
      name = local.kong_namespace
    }
  }
}

# Kong ConfigMap for custom configuration
resource "kubernetes_config_map" "kong_config" {
  metadata {
    name      = "kong-custom-config"
    namespace = var.create_namespace ? kubernetes_namespace.kong[0].metadata[0].name : local.kong_namespace
  }

  data = {
    "kong.conf" = <<-EOF
      database = ${var.database_type}
      pg_host = ${var.postgres_host}
      pg_port = ${var.postgres_port}
      pg_user = ${var.postgres_user}
      pg_database = ${var.postgres_database}

      # Nginx settings
      nginx_worker_processes = auto
      nginx_http_keepalive_timeout = 60s

      # Logging
      log_level = ${var.log_level}

      # Admin API
      admin_listen = 0.0.0.0:8001
      admin_access_log = /dev/stdout
      admin_error_log = /dev/stderr

      # Proxy
      proxy_listen = 0.0.0.0:8000, 0.0.0.0:8443 ssl
      proxy_access_log = /dev/stdout
      proxy_error_log = /dev/stderr

      # SSL
      ssl_cert = /etc/kong/ssl/tls.crt
      ssl_cert_key = /etc/kong/ssl/tls.key

      # Plugins
      plugins = bundled,rate-limiting,request-termination,jwt,cors,request-transformer
    EOF
  }
}

# Kong RBAC
resource "kubernetes_service_account" "kong" {
  metadata {
    name      = "kong"
    namespace = var.create_namespace ? kubernetes_namespace.kong[0].metadata[0].name : local.kong_namespace
    annotations = {
      "eks.amazonaws.com/role-arn" = var.kong_iam_role_arn
    }
  }
}

resource "kubernetes_cluster_role" "kong" {
  metadata {
    name = "kong-ingress"
  }

  rule {
    api_groups = [""]
    resources  = ["endpoints", "nodes", "pods", "secrets", "services"]
    verbs      = ["list", "watch", "get"]
  }

  rule {
    api_groups = [""]
    resources  = ["events"]
    verbs      = ["create", "patch"]
  }

  rule {
    api_groups = ["extensions", "networking.k8s.io"]
    resources  = ["ingresses", "ingressclasses"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["extensions", "networking.k8s.io"]
    resources  = ["ingresses/status"]
    verbs      = ["update"]
  }

  rule {
    api_groups = ["configuration.konghq.com"]
    resources  = ["kongplugins", "kongconsumers", "kongcredentials", "kongingresses", "tcpingresses", "udpingresses", "kongclusterplugins"]
    verbs      = ["get", "list", "watch"]
  }
}

resource "kubernetes_cluster_role_binding" "kong" {
  metadata {
    name = "kong-ingress"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.kong.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.kong.metadata[0].name
    namespace = var.create_namespace ? kubernetes_namespace.kong[0].metadata[0].name : local.kong_namespace
  }
}

# Kong Deployment
resource "kubernetes_deployment" "kong" {
  metadata {
    name      = "kong"
    namespace = var.create_namespace ? kubernetes_namespace.kong[0].metadata[0].name : local.kong_namespace
    labels = {
      app = "kong"
    }
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = "kong"
      }
    }

    template {
      metadata {
        labels = {
          app = "kong"
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "8100"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.kong.metadata[0].name

        container {
          name  = "kong"
          image = "kong:${var.kong_version}"

          env {
            name  = "KONG_DATABASE"
            value = var.database_type
          }

          env {
            name  = "KONG_PG_HOST"
            value = var.postgres_host
          }

          env {
            name = "KONG_PG_PASSWORD"
            value_from {
              secret_key_ref {
                name = var.postgres_secret_name
                key  = "password"
              }
            }
          }

          env {
            name  = "KONG_PROXY_ACCESS_LOG"
            value = "/dev/stdout"
          }

          env {
            name  = "KONG_ADMIN_ACCESS_LOG"
            value = "/dev/stdout"
          }

          env {
            name  = "KONG_PROXY_ERROR_LOG"
            value = "/dev/stderr"
          }

          env {
            name  = "KONG_ADMIN_ERROR_LOG"
            value = "/dev/stderr"
          }

          env {
            name  = "KONG_ADMIN_LISTEN"
            value = "0.0.0.0:8001"
          }

          port {
            name           = "proxy"
            container_port = 8000
          }

          port {
            name           = "proxy-ssl"
            container_port = 8443
          }

          port {
            name           = "admin"
            container_port = 8001
          }

          port {
            name           = "metrics"
            container_port = 8100
          }

          resources {
            requests = {
              cpu    = var.resources_requests_cpu
              memory = var.resources_requests_memory
            }
            limits = {
              cpu    = var.resources_limits_cpu
              memory = var.resources_limits_memory
            }
          }

          liveness_probe {
            http_get {
              path = "/status"
              port = 8001
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/status"
              port = 8001
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }
      }
    }
  }
}

# Kong Service
resource "kubernetes_service" "kong_proxy" {
  metadata {
    name      = "kong-proxy"
    namespace = var.create_namespace ? kubernetes_namespace.kong[0].metadata[0].name : local.kong_namespace
    annotations = var.service_annotations
  }

  spec {
    type = var.service_type

    selector = {
      app = "kong"
    }

    port {
      name        = "proxy"
      port        = 80
      target_port = 8000
    }

    port {
      name        = "proxy-ssl"
      port        = 443
      target_port = 8443
    }
  }
}

resource "kubernetes_service" "kong_admin" {
  metadata {
    name      = "kong-admin"
    namespace = var.create_namespace ? kubernetes_namespace.kong[0].metadata[0].name : local.kong_namespace
  }

  spec {
    type = "ClusterIP"

    selector = {
      app = "kong"
    }

    port {
      name        = "admin"
      port        = 8001
      target_port = 8001
    }
  }
}

# Default Rate Limiting Plugin (Global)
resource "kubernetes_manifest" "rate_limiting_plugin" {
  count = var.enable_rate_limiting ? 1 : 0

  manifest = {
    apiVersion = "configuration.konghq.com/v1"
    kind       = "KongClusterPlugin"
    metadata = {
      name = "global-rate-limiting"
      labels = {
        global = "true"
      }
      annotations = {
        "kubernetes.io/ingress.class" = "kong"
      }
    }
    plugin = "rate-limiting"
    config = {
      minute              = var.rate_limit_per_minute
      policy              = "redis"
      redis_host          = var.redis_host
      redis_port          = var.redis_port
      redis_password      = var.redis_password
      fault_tolerant      = true
      hide_client_headers = false
    }
  }
}

# Circuit Breaker Plugin (using request-termination)
resource "kubernetes_manifest" "circuit_breaker_plugin" {
  count = var.enable_circuit_breaker ? 1 : 0

  manifest = {
    apiVersion = "configuration.konghq.com/v1"
    kind       = "KongClusterPlugin"
    metadata = {
      name = "circuit-breaker"
      annotations = {
        "kubernetes.io/ingress.class" = "kong"
      }
    }
    plugin = "request-termination"
    config = {
      status_code = 503
      message     = "Service temporarily unavailable"
    }
  }
}

# CORS Plugin
resource "kubernetes_manifest" "cors_plugin" {
  count = var.enable_cors ? 1 : 0

  manifest = {
    apiVersion = "configuration.konghq.com/v1"
    kind       = "KongClusterPlugin"
    metadata = {
      name = "global-cors"
      labels = {
        global = "true"
      }
      annotations = {
        "kubernetes.io/ingress.class" = "kong"
      }
    }
    plugin = "cors"
    config = {
      origins         = var.cors_origins
      methods         = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
      headers         = ["Accept", "Authorization", "Content-Type", "X-Request-ID"]
      exposed_headers = ["X-Request-ID"]
      max_age         = 3600
      credentials     = true
    }
  }
}

# JWT Authentication Plugin
resource "kubernetes_manifest" "jwt_plugin" {
  count = var.enable_jwt_auth ? 1 : 0

  manifest = {
    apiVersion = "configuration.konghq.com/v1"
    kind       = "KongClusterPlugin"
    metadata = {
      name = "jwt-auth"
      annotations = {
        "kubernetes.io/ingress.class" = "kong"
      }
    }
    plugin = "jwt"
    config = {
      claims_to_verify = ["exp"]
      key_claim_name   = "kid"
    }
  }
}
