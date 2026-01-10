{{/*
Expand the name of the chart.
*/}}
{{- define "apply-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "apply-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "apply-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "apply-service.labels" -}}
helm.sh/chart: {{ include "apply-service.chart" . }}
{{ include "apply-service.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: hirehub
app.kubernetes.io/component: backend
{{- if .Values.global }}
{{- if .Values.global.labels }}
{{ toYaml .Values.global.labels }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "apply-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "apply-service.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "apply-service.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "apply-service.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Get the namespace
*/}}
{{- define "apply-service.namespace" -}}
{{- if .Values.global }}
{{- default .Release.Namespace .Values.global.namespace }}
{{- else }}
{{- .Release.Namespace }}
{{- end }}
{{- end }}

{{/*
Istio labels for pods
*/}}
{{- define "apply-service.istioLabels" -}}
{{- if .Values.global }}
{{- if .Values.global.istio }}
{{- if .Values.global.istio.enabled }}
sidecar.istio.io/inject: {{ .Values.global.istio.injection | default "enabled" | quote }}
{{- end }}
{{- end }}
{{- end }}
{{- end }}

{{/*
IRSA annotation for service account
*/}}
{{- define "apply-service.irsaAnnotation" -}}
{{- if .Values.serviceAccount.irsaRoleArn }}
eks.amazonaws.com/role-arn: {{ .Values.serviceAccount.irsaRoleArn }}
{{- else if .Values.global }}
{{- if .Values.global.irsa }}
{{- if .Values.global.irsa.enabled }}
eks.amazonaws.com/role-arn: {{ .Values.global.irsa.roleArnPrefix }}/hirehub-apply-service-role
{{- end }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Image name with registry
*/}}
{{- define "apply-service.image" -}}
{{- $registry := "" }}
{{- if .Values.global }}
{{- if .Values.global.imageRegistry }}
{{- $registry = printf "%s/" .Values.global.imageRegistry }}
{{- end }}
{{- end }}
{{- printf "%s%s:%s" $registry .Values.image.repository (.Values.image.tag | default .Chart.AppVersion) }}
{{- end }}

{{/*
Environment from global config
*/}}
{{- define "apply-service.environment" -}}
{{- if .Values.global }}
{{- default "dev" .Values.global.environment }}
{{- else }}
dev
{{- end }}
{{- end }}
