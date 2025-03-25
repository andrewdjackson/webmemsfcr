/*
export const timeFormat                         = "15:04:05.000"
export const secondsToLambdaOscillations        = 90
export const minimumDatasetSize                 = 1
export const expectedHighDTC5Value              = 255
export const expectedLowDTCValue                = 0
export const maximumIdleBasePosition            = 250
*/




//
// Engine Operating Constants
//
export const MAX_IDLE_RPM                       = 1300
export const MAX_RPM                            = 6000
export const ENGINE_NOT_RUNNING                 = 0
export const MAX_IDLE_COIL_TIME                 = 6 // time in milliseconds
export const INVALID_CRANKSHAFT_POSITION_SENSOR = 0

// Engine Load and MAP Constants
export const MAX_MAP_VALUE                      = 42
export const MAX_MAP_WARM_IDLE                  = 37
export const MAP_ENGINE_NOT_RUNNING             = 100

// Stepper Motor and Idle Air Control Constants
export const INVALID_IAC_POSITION               = 0
export const MIN_IAC_STEPS                      = 30 // 30 steps at operating temp
export const MAX_IAC_STEPS                      = 55 // 35 steps at operating temp
export const MAX_JACK_COUNT                     = 100
export const MAX_AIR_INTAKE_TEMPERATURE         = 120

//
// Idle Management Constants
//
export const DEFAULT_IDLE_THROTTLE_ANGLE        = 15
export const DEFAULT_IDLE_THROTTLE_POT_VOLTAGE  = 0.9
export const IDLE_SPEED_SAMPLE_SIZE             = 30
export const MAX_IDLE_OFFSET                    = 50
export const MIN_IDLE_HOT                       = 10
export const MAX_IDLE_HOT                       = 55
export const MIN_IDLE_BASE_POSITION             = 45
export const MAX_IDLE_BASE_POSITION             = 55
export const MAX_IDLE_SPEED_DEVIATION           = 100

//
// Battery Constants
//
export const MIN_BATTERY_VOLTAGE                = 12.8 // min voltage for a healthy battery
export const MIN_BATTERY_CHARGING_VOLTAGE       = 13.2 // min voltage expected to determine battery is charging
export const MIN_BATTERY_RECOVERY_VOLTAGE       = 0.3  // min amount the battery voltage is expected to rise after cranking
export const MIN_BATTERY_RECOVERY_TIME          = 5    // time in seconds to allow for the battery to recover from cranking

//
// Coolant and Thermostat Constants
//
export const MAX_COOLANT_TEMPERATURE            = 120
export const MIN_ENGINE_OPERATING_TEMPERATURE   = 78
export const ECU_ENGINE_OPERATING_TEMPERATURE   = 80
//export const SECONDS_PER_DEGREE                 = 11
//export const THERMOSTAT_OPEN_DELAY              = SECONDS_PER_DEGREE * 3

//
// Lambda and O2 System Constants
//
export const LAMBDA_DEFAULT_VOLTAGE             = 435
export const LAMBDA_OSCILLATION_MIN_STDDEV      = 100
export const LAMBDA_WARMUP_TIME_IN_SECONDS      = 90
export const MIN_LAMBDA_VOLTAGE                 = 10
export const MAX_LAMBDA_VOLTAGE                 = 900
export const MAX_VALUES_PER_OSCILLATION        = 10

//
// Dataframe Array Location Pointers
//
export const FIRST_DATAFRAME                    = 0
export const CURRENT_DATAFRAME                  = -1
export const PREVIOUS_DATAFRAME                 = -2

//
// Faults
//
export const MIN_FAULTS                         = 10 // the minimum number of faults events before a fault is raised