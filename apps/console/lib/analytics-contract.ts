import posthog from 'posthog-js'

export const analyticsEventNames = [
  'auth_login_succeeded',
  'auth_login_failed',
  'console_session_started',
  'console_session_ended',
  'nav_item_clicked',
  'page_viewed',
  'search_used',
  'patient_created',
  'patient_profile_updated',
  'patient_dashboard_opened',
  'patient_deleted',
  'program_creation_started',
  'program_creation_completed',
  'program_creation_abandoned',
  'preset_created',
  'preset_updated',
  'preset_applied_to_program',
  'device_selected',
  'device_connection_state_changed',
  'session_started',
  'session_paused',
  'session_resumed',
  'session_ended',
  'exercise_skipped',
  'scene_setting_changed',
  'casting_toggled',
  'session_notes_saved',
  'supplemental_therapy_selected',
  'session_deleted_without_save',
  'program_assigned_to_patient',
  'ui_error_shown',
  'api_request_failed',
  'validation_error_shown',
  'feature_flag_variant_seen',
] as const

export type AnalyticsEventName = (typeof analyticsEventNames)[number]

type AuthRole = 'admin' | 'tester' | 'clinician' | 'other'
type NavItem =
  | 'devices'
  | 'patients'
  | 'presets'
  | 'guides'
  | 'forms'
  | 'landing_page'
  | 'user_profile'
type StartType = 'blank' | 'preset'
type SessionMode = 'main' | 'free'
type SessionEndReason = 'manual' | 'disconnect' | 'error'
type ConnectionState = 'connected' | 'disconnected' | 'error'
type SkipDirection = 'back' | 'forward'
type SceneSetting = 'avatar' | 'map' | 'sitting'
type RouteGroup = 'auth' | 'patient' | 'device' | 'preset' | 'user' | 'other'
type Source = 'button' | 'keyboard' | 'auto' | 'import' | 'unknown'
type TabView =
  | 'virtality-presets'
  | 'user-profile'
  | 'user-sessions'
  | 'user-presets'
  | 'patient-profile'
  | 'patient-sessions'
  | 'patient-session'
  | 'patient-medical-history'
  | 'patient-programs'
  | 'patient-program'

export type CommonEventProps = {
  user_id?: string
  org_id?: string
  role?: AuthRole
  page?: string
  route_group?: RouteGroup
  tab_view?: TabView
  source?: Source
  app_version?: string
  timestamp_client?: string
}

export type AnalyticsEventPayloadMap = {
  auth_login_succeeded: CommonEventProps
  auth_login_failed: CommonEventProps & {
    reason?: string
  }
  console_session_started: CommonEventProps
  console_session_ended: CommonEventProps & {
    duration_sec?: number
    end_reason?: 'inactive_timeout' | 'tab_close' | 'manual'
  }
  nav_item_clicked: CommonEventProps & {
    item: NavItem
  }
  page_viewed: CommonEventProps & {
    page: string
    from_page?: string
  }
  search_used: CommonEventProps & {
    search_scope: string
    query_length: number
    results_count?: number
  }
  patient_created: CommonEventProps & {
    patient_id: string
  }
  patient_profile_updated: CommonEventProps & {
    patient_id: string
    updated_fields?: string[]
  }
  patient_dashboard_opened: CommonEventProps & {
    patient_id: string
  }
  patient_deleted: CommonEventProps & {
    patient_id: string
  }
  program_creation_started: CommonEventProps & {
    patient_id?: string
    start_type: StartType
    source_preset_id?: string
  }
  program_creation_completed: CommonEventProps & {
    patient_id?: string
    program_id: string
    exercise_count: number
    source_preset_id?: string
  }
  program_creation_abandoned: CommonEventProps & {
    patient_id?: string
    step: number
    time_spent_sec: number
  }
  preset_created: CommonEventProps & {
    preset_id: string
    exercise_count?: number
  }
  preset_updated: CommonEventProps & {
    preset_id: string
    changed_fields?: string[]
  }
  preset_applied_to_program: CommonEventProps & {
    preset_id: string
    program_id?: string
    patient_id?: string
  }
  device_selected: CommonEventProps & {
    device_id: string
    device_type?: string
    was_last_used?: boolean
  }
  device_connection_state_changed: CommonEventProps & {
    device_id?: string
    state: ConnectionState
  }
  session_started: CommonEventProps & {
    patient_id: string
    session_id?: string
    program_id?: string
    mode: SessionMode
    device_id?: string
  }
  session_paused: CommonEventProps & {
    patient_id: string
    session_id?: string
    program_id?: string
    mode?: SessionMode
    device_id?: string
  }
  session_resumed: CommonEventProps & {
    patient_id: string
    session_id?: string
    program_id?: string
    mode?: SessionMode
    device_id?: string
  }
  session_ended: CommonEventProps & {
    patient_id: string
    session_id?: string
    program_id?: string
    duration_sec?: number
    end_reason: SessionEndReason
    device_id?: string
  }
  exercise_skipped: CommonEventProps & {
    patient_id?: string
    session_id?: string
    exercise_id: string
    direction: SkipDirection
  }
  scene_setting_changed: CommonEventProps & {
    patient_id?: string
    session_id?: string
    setting: SceneSetting
    value?: string | boolean
  }
  casting_toggled: CommonEventProps & {
    enabled: boolean
    patient_id?: string
    session_id?: string
  }
  session_notes_saved: CommonEventProps & {
    patient_id: string
    session_id: string
    notes_length: number
    has_supplemental_therapy: boolean
  }
  supplemental_therapy_selected: CommonEventProps & {
    patient_id: string
    session_id: string
    therapy_count: number
    includes_other: boolean
  }
  session_deleted_without_save: CommonEventProps & {
    patient_id: string
    session_id: string
  }
  program_assigned_to_patient: CommonEventProps & {
    patient_id: string
    program_id: string
  }
  ui_error_shown: CommonEventProps & {
    error_type: string
    surface: string
    recoverable?: boolean
  }
  api_request_failed: CommonEventProps & {
    endpoint_group: string
    status_code?: number
  }
  validation_error_shown: CommonEventProps & {
    form: string
    field: string
    message?: string
  }
  feature_flag_variant_seen: CommonEventProps & {
    flag_key: string
    variant: string | boolean | number
  }
}

export type AnalyticsEventProps<TEvent extends AnalyticsEventName> =
  AnalyticsEventPayloadMap[TEvent]

export type AnalyticsEvent<TEvent extends AnalyticsEventName> = {
  name: TEvent
  properties: AnalyticsEventPayloadMap[TEvent]
}

export const analyticsContract = Object.freeze(
  Object.fromEntries(
    analyticsEventNames.map((eventName) => [eventName, eventName]),
  ) as { [TEvent in AnalyticsEventName]: TEvent },
)

export const createAnalyticsEvent = <TEvent extends AnalyticsEventName>(
  name: TEvent,
  properties: AnalyticsEventPayloadMap[TEvent],
): AnalyticsEvent<TEvent> => ({
  name,
  properties,
})

export const trackAnalyticsEvent = <TEvent extends AnalyticsEventName>(
  name: TEvent,
  properties: AnalyticsEventPayloadMap[TEvent],
) => {
  posthog.capture(name, properties as Record<string, unknown>)
}
