type WidgetLocation = {
    pos: number,
    lat?: number,
    lon?: number,
    name?: string,
}

type ListWidgetConfig = {
    refreshInterval: number,  // interval the widget is updated after (in seconds),
    openUrlOnTap: boolean, // open url on tap
    openUrl: string, // url to open
}

type ListWidgetConfigOpt = {
    refreshInterval?: number,  // interval the widget is updated after (in seconds),
    openUrlOnTap?: boolean, // open url on tap
    openUrl?: string, // url to open
}

type WidgetConfig = ListWidgetConfig & {
    cacheMaxAge: number, // maximum age of items in the cache. (in seconds) Younger items wont be updated with  data from the rki-api.

    maxShownDays: number,   // number of days shown in graphs
    graphUpsideDown: boolean,  // show graphs upside down (0 is top, max is bottom, default is: 0 at bottom and max at the top)
    graphShowIndex: 'incidence' | 'cases', // values used for the graph. 'cases' for cases or 'incidence' for incidence

    stateUseShortName: boolean, // use short name of stateRow
    alternateLarge: boolean, // use alternative layout ofr large stack

    incidenceDisableLive: boolean,
    showVaccine: boolean, // show the data regarding the vaccination. Small widget wont show this information.

}

type WidgetConfigOpt = ListWidgetConfigOpt & {
    cacheMaxAge?: number, // maximum age of items in the cache. (in seconds) Younger items wont be updated with  data from the rki-api.

    maxShownDays?: number,   // number of days shown in graphs
    graphUpsideDown?: boolean,  // show graphs upside down (0 is top, max is bottom, default is: 0 at bottom and max at the top)
    graphShowIndex?: 'incidence' | 'cases', // values used for the graph. 'cases' for cases or 'incidence' for incidence

    stateUseShortName?: boolean, // use short name of stateRow
    alternateLarge?: boolean, // use alternative layout ofr large stack

    incidenceDisableLive?: boolean,
    showVaccine?: boolean, // show the data regarding the vaccination. Small widget wont show this information.

}

type WidgetSetup = {
    locations: WidgetLocation[],
    config: WidgetConfigOpt
}