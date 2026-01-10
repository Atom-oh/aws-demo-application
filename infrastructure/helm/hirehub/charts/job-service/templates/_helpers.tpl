{{/*
Expand the name of the chart.
*/}}
{{- define "job-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "job-service.fullname" -}}
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
{{- define "job-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "job-service.labels" -}}
helm.sh/chart: {{ include "job-service.chart" . }}
{{ include "job-service.selectorLabels" . }}
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
{{- define "job-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "job-service.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "job-service.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "job-service.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Get the namespace
*/}}
{{- define "job-service.namespace" -}}
{{- if .Values.global }}
{{- default .Release.Namespace .Values.global.namespace }}
{{- else }}
{{- .Release.Namespace }}
{{- end }}
{{- end }}

{{/*
Istio labels for pods
*/}}
{{- define "job-service.istioLabels" -}}
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
{{- define "job-service.irsaAnnotation" -}}
{{- if .Values.serviceAccount.irsaRoleArn }}
eks.amazonaws.com/role-arn: {{ .Values.serviceAccount.irsaRoleArn }}
{{- else if .Values.global }}
{{- if .Values.global.irsa }}
{{- if .Values.global.irsa.enabled }}
eks.amazonaws.com/role-arn: {{ .Values.global.irsa.roleArnPrefix }}/hirehub-job-service-role
{{- end }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Image name with registry
*/}}
{{- define "job-service.image" -}}
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
{{- define "job-service.environment" -}}
{{- if .Values.global }}
{{- default "dev" .Values.global.environment }}
{{- else }}
dev
{{- end }}
{{- end }}
