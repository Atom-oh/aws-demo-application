{{/*
Expand the name of the chart.
*/}}
{{- define "hirehub.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "hirehub.fullname" -}}
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
{{- define "hirehub.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "hirehub.labels" -}}
helm.sh/chart: {{ include "hirehub.chart" . }}
{{ include "hirehub.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: hirehub
{{- if .Values.global.labels }}
{{ toYaml .Values.global.labels }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "hirehub.selectorLabels" -}}
app.kubernetes.io/name: {{ include "hirehub.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the namespace name
*/}}
{{- define "hirehub.namespace" -}}
{{- default "hirehub" .Values.global.namespace }}
{{- end }}

{{/*
Istio injection labels
*/}}
{{- define "hirehub.istioLabels" -}}
{{- if .Values.global.istio.enabled }}
sidecar.istio.io/inject: {{ .Values.global.istio.injection | quote }}
{{- end }}
{{- end }}

{{/*
Global annotations
*/}}
{{- define "hirehub.annotations" -}}
{{- if .Values.global.annotations }}
{{ toYaml .Values.global.annotations }}
{{- end }}
{{- end }}

{{/*
Environment identifier
*/}}
{{- define "hirehub.environment" -}}
{{- default "dev" .Values.global.environment }}
{{- end }}

{{/*
Image pull secrets
*/}}
{{- define "hirehub.imagePullSecrets" -}}
{{- if .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- range .Values.global.imagePullSecrets }}
  - name: {{ . }}
{{- end }}
{{- end }}
{{- end }}
