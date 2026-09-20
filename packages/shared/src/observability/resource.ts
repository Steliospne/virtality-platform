import { resourceFromAttributes } from '@opentelemetry/resources'

export const DEFAULT_SERVICE_NAMESPACE = 'virtality'

export type ServiceIdentity = {
  serviceName: string
  serviceNamespace: string
  serviceVersion: string
  deploymentEnvironment: string
}

export function getDeploymentEnvironment() {
  return (
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT ??
    process.env.ENV ??
    process.env.NODE_ENV ??
    'development'
  )
}

export function resolveServiceIdentity(options: {
  serviceName: string
  serviceNamespace?: string
  serviceVersion?: string
}): ServiceIdentity {
  return {
    serviceName: options.serviceName,
    serviceNamespace: options.serviceNamespace ?? DEFAULT_SERVICE_NAMESPACE,
    serviceVersion:
      options.serviceVersion ?? process.env.npm_package_version ?? '0.0.0',
    deploymentEnvironment: getDeploymentEnvironment(),
  }
}

// Same resource for logs and metrics so Loki stream labels and Prometheus
// series labels line up (service_name, deployment_environment_name, …).
export function createServiceResource(identity: ServiceIdentity) {
  return resourceFromAttributes({
    'service.name': identity.serviceName,
    'service.namespace': identity.serviceNamespace,
    'service.version': identity.serviceVersion,
    'deployment.environment.name': identity.deploymentEnvironment,
  })
}
