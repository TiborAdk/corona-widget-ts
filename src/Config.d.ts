type Config = {
    config: string, // version of the config
    version: string, // version of the script
    autoUpdate: boolean // script is updated automatically
    autoUpdateInterval: number, // timeframe the script trys to update it self (in days)
    geoCacheAccuracy: 0 | 1 | 2 | 3 | 4, // accuracy the gps staticCoords are cached with (0: 111 Km; 1: 11,1 Km; 2: 1,11 Km; 3: 111 m; 4: 11,1 m)

    def: WidgetConfig,
    widgets: Record<string, WidgetSetup>
}

type ConfigOpt = {
    version?: string, // version of the script
    autoUpdate?: boolean // script is updated automatically
    autoUpdateInterval?: number, // timeframe the script trys to update it self (in days)
    csvRvalueField?: string[], // numbered field (column), because of possible encoding changes in columns names on each update
    geoCacheAccuracy?: 0 | 1 | 2 | 3 | 4, // accuracy the gps staticCoords are cached with (0: 111 Km; 1: 11,1 Km; 2: 1,11 Km; 3: 111 m; 4: 11,1 m)

    def?: WidgetConfigOpt,
    widgets?: Record<string, WidgetSetup>
}
type Config1_3 = {
    config: string, // version of the config
    autoUpdate: boolean // script is updated automatically
    autoUpdateInterval: number, // timeframe the script trys to update it self (in days)
    geoCacheAccuracy: 0 | 1 | 2 | 3 | 4, // accuracy the gps staticCoords are cached with (0: 111 Km; 1: 11,1 Km; 2: 1,11 Km; 3: 111 m; 4: 11,1 m)

    def: WidgetConfig,
    widgets: Record<string, WidgetSetup>
}

type ConfigOpt1_3 = {
    config: string, // version of the config
    autoUpdate?: boolean // script is updated automatically
    autoUpdateInterval?: number, // timeframe the script trys to update it self (in days)
    csvRvalueField?: string[], // numbered field (column), because of possible encoding changes in columns names on each update
    geoCacheAccuracy?: 0 | 1 | 2 | 3 | 4, // accuracy the gps staticCoords are cached with (0: 111 Km; 1: 11,1 Km; 2: 1,11 Km; 3: 111 m; 4: 11,1 m)

    def?: WidgetConfigOpt,
    widgets?: Record<string, WidgetSetup>
}