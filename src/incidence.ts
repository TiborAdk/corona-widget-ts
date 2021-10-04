// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: briefcase-medical;

// Licence: Robert-Koch-Institut (RKI), dl-de/by-2-0 (https://www.govdata.de/dl-de/by-2-0)

const CFG: Config = {
    version: '1.7.1',
    autoUpdate: true, // whether the script should update it self
    autoUpdateInterval: 1, // how often the script should update it self (in days)
    geoCacheAccuracy: 1, // accuracy the gps staticCoords are cached with (0: 111 Km; 1: 11,1 Km; 2: 1,11 Km; 3: 111 m; 4: 11,1 m)
    def: {
        cacheMaxAge: 3600, // maximum age of items in the cache. (in seconds) Younger items wont be updated with data from the rki-api.

        maxShownDays: 28, // number of days shown in graphs
        graphUpsideDown: false, // show graphs upside down (0 is top, max is bottom, default is: 0 at bottom and max at the top)
        graphShowIndex: 'incidence', // values used for the graph. 'cases' for cases or 'incidence' for incidence


        stateUseShortName: true, // use short name of stateRow

        refreshInterval: 3600, // interval the widget is updated after (in seconds),
        openUrlOnTap: false, // open url on tap
        openUrl: "https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4",
        alternateLarge: false, // use alternative layout ofr large stack

        incidenceDisableLive: false, // use the incidence value from the api
        showVaccine: true, // show the data regarding the vaccination. Small widget wont show this information.
    },
    widgets: {},
}

const VERSION = '1.7.1';
const HTTP_SCRIPT = 'https://raw.githubusercontent.com/TiborAdk/corona-widget-ts/master/built/incidence.js';
const HTTP_CONFIG = 'https://raw.githubusercontent.com/TiborAdk/corona-widget-ts/master/config.json';
const DIR_DEV = 'corona_widget_dev';
const FILE_DEV = 'dev';
const DIR = 'corona_widget_ts';
const FILE = 'corona_widget';
const CSV_RVALUE_FIELDS: string[] = ['Schätzer_7_Tage_R_Wert', 'Punktschätzer des 7-Tage-R Wertes', 'Schไtzer_7_Tage_R_Wert', 'Punktschไtzer des 7-Tage-R Wertes', 'PS_7_Tage_R_Wert'];

type State = {
    short: string,
    name: string,
}

enum AreaType {
    KS = 'KS', // Kreisfreie Stadt
    SK = 'SK', // Stadtkreis
    K = 'K',  // Kreis
    LK = 'LK', // Landkreis
    SV_K = 'SV_K', // Sonderverband offiziell Kreis
    SV_LK = 'SV_LK',  // Sonderverband offiziell Landkreis
    BZ = 'BZ', // Bezirk?
}

type Env = {
    state: { nameIndex: string };
    areaIBZ: Map<number, AreaType>,
    cacheAreas: Map<string, IncidenceData<MetaArea>>,
    cacheStates: Map<string, IncidenceData<MetaState>>,
    cacheCountries: Map<string, IncidenceData<MetaCountry>>,
    cacheVaccines: Map<string, VaccineData>,
    states: Map<string, State>,
    script: {
        filename: string,
    },
}

const ENV: Env = {
    state: {nameIndex: CFG.def.stateUseShortName ? 'short' : 'name'},
    areaIBZ: new Map([
            [40, AreaType.KS], // Kreisfreie Stadt
            [41, AreaType.SK], // Stadtkreis
            [42, AreaType.K],  // Kreis
            [43, AreaType.LK], // Landkreis
            [45, AreaType.SV_K], // Sonderverband offiziell Kreis
            [46, AreaType.SV_LK],  // Sonderverband offiziell Landkreis
        ],
    ),
    cacheAreas: new Map<string, IncidenceData<MetaArea>>(),
    cacheCountries: new Map<string, IncidenceData<MetaCountry>>(),
    cacheStates: new Map<string, IncidenceData<MetaState>>(),
    cacheVaccines: new Map<string, VaccineData>(),
    states: new Map<string, State>([
            ['1', {short: 'SH', name: 'Schleswig-Holstein'}],
            ['2', {short: 'HH', name: 'Hamburg'}],
            ['3', {short: 'NI', name: 'Niedersachsen'}],
            ['4', {short: 'HB', name: 'Bremen'}],
            ['5', {short: 'NRW', name: 'Nordrhein-Westfalen'}],
            ['6', {short: 'HE', name: 'Hessen'}],
            ['7', {short: 'RP', name: 'Rheinland-Pfalz'}],
            ['8', {short: 'BW', name: 'Baden-Württemberg'}],
            ['9', {short: 'BY', name: 'Bayern'}],
            ['10', {short: 'SL', name: 'Saarland'}],
            ['11', {short: 'BE', name: 'Berlin'}],
            ['12', {short: 'BB', name: 'Brandenburg'}],
            ['13', {short: 'MV', name: 'Mecklenburg-Vorpommern'}],
            ['14', {short: 'SN', name: 'Sachsen'}],
            ['15', {short: 'ST', name: 'Sachsen-Anhalt'}],
            ['16', {short: 'TH', name: 'Thüringen'}],
        ],
    ),
    script: {
        filename: this.module.filename.replace(/^.*[\\/]/, ''),
    },
}

enum DataStatus {
    OK = 'OK',
    OFFLINE = 'offline',
    CACHED = 'cached',
    ERROR = 'error',
    NOT_FOUND = 'not found}',
    API_ERROR = 'api error',
}

enum IncidenceTrend {
    DAY = "day",
    WEEK = "week"
}

enum TrendArrow {
    UP = '↑',
    DOWN = '↓',
    RIGHT = '→',
    UP_RIGHT = '↗',
}

class Colors {
    static readonly WARN: Color = new Color('#dbc43d', 1);
    static readonly DARKDARKRED: Color = new Color('#6b1200', 1);
    static readonly DARKRED: Color = new Color('#a1232b', 1);
    static readonly RED: Color = Color.dynamic(new Color('#ff3b30', 1), new Color('#ff453a', 1)) // new Color('#f6000f', 1);
    static readonly ORANGE: Color = Color.dynamic(new Color('#ff9500', 1), new Color('#ff9f0a', 1)) //new Color('#ff7927', 1);
    static readonly YELLOW: Color = Color.dynamic(new Color('#ffcc00', 1), new Color('#ffd60a', 1)) //new Color('#f5d800', 1);
    static readonly GREEN: Color = Color.dynamic(new Color('#34c759', 1), new Color('#30d158', 1)) //new Color('#1CC747', 1);
    static readonly GRAY: Color = new Color('#d0d0d0', 1);
    static readonly DEBUG_BLUE: Color = new Color('#0047bb', 1);
    static readonly DEBUG_GREEN: Color = new Color('#00b140', 1);
    static readonly BLACK: Color = Color.black();
    static readonly WHITE: Color = Color.white();
    static readonly FOREGROUND: Color = Color.dynamic(Colors.BLACK, Colors.WHITE);
    static readonly BACKGROUND: Color = Color.dynamic(Colors.WHITE, Colors.BLACK);
    static readonly BACKGROUND2: Color = Color.dynamic(new Color('#f2f2f7', 1), new Color('#1c1c1e', 1));
    static readonly BACKGROUND3: Color = Color.dynamic(new Color('#e5e5ea', 1), new Color('#2c2c2e', 1));
    static readonly BACKGROUND4: Color = Color.dynamic(new Color('#d1d1d6', 1), new Color('#3a3a3c', 1));
}

function partial<T, U>(fn: (first: T, ...last) => U, first: T): (...last) => U {
    return (...last) => {
        return fn(first, ...last)
    }
}

class CustomFont extends Font {
    static readonly XLARGE: CustomFont = CustomFont.bold(26);
    static readonly LARGE: CustomFont = CustomFont.medium(20);
    static readonly MEDIUM: CustomFont = CustomFont.medium(14);
    static readonly NORMAL: CustomFont = CustomFont.medium(12);
    static readonly SMALL: CustomFont = CustomFont.bold(11);
    static readonly SMALL2: CustomFont = CustomFont.bold(10);
    static readonly XSMALL: CustomFont = CustomFont.bold(9);
    static readonly XLARGE_MONO: CustomFont = CustomFont.boldMono(26);
    static readonly LARGE_MONO: CustomFont = CustomFont.mediumMono(20);
    static readonly MEDIUM_MONO: CustomFont = CustomFont.mediumMono(14);
    static readonly NORMAL_MONO: CustomFont = CustomFont.mediumMono(12);
    static readonly SMALL_MONO: CustomFont = CustomFont.boldMono(11);
    static readonly SMALL2_MONO: CustomFont = CustomFont.boldMono(10);
    static readonly XSMALL_MONO: CustomFont = CustomFont.boldMono(9);
    size: number;
    create: (size: number) => CustomFont;

    constructor(name: string, size: number) {
        super(name, size);
        this.size = size;
        this.create = () => {
            throw Error('Not implemented')
        }
    }

    bigger(offset: number): CustomFont {
        return this.create(this.size + offset);
    }

    smaller(offset: number): CustomFont {
        return this.bigger(-offset);
    }

    newSizedByOffset(offset: number): CustomFont {
        return this.bigger(offset);
    }

    static bold(size: number): CustomFont {
        return CustomFont.fromFont(Font.boldSystemFont, size);
    }

    static medium(size: number): CustomFont {
        return CustomFont.fromFont(Font.mediumSystemFont, size);
    }

    static boldMono(size: number): CustomFont {
        return CustomFont.fromFont(Font.boldMonospacedSystemFont, size);
    }

    static mediumMono(size: number): CustomFont {
        return CustomFont.fromFont(Font.mediumMonospacedSystemFont, size);
    }

    static boldRounded(size: number): CustomFont {
        return CustomFont.fromFont(Font.mediumMonospacedSystemFont, size)
    }

    private static fromFont(create: (size: number) => Font, size: number): CustomFont {
        const custom: CustomFont = create(size) as CustomFont;
        custom.size = size;
        custom.create = partial(CustomFont.fromFont, create);
        custom.bigger = function (offset: number): CustomFont {
            return custom.create(custom.size + offset)
        };
        custom.smaller = function (offset: number): CustomFont {
            return custom.bigger(-offset)
        };
        custom.newSizedByOffset = function (size: number): CustomFont {
            return custom.bigger(size);
        }
        return custom;
    }
}

type IncidenceLimit = { color: Color; limit: number }

class Incidence {
    static readonly DARKDARKRED: IncidenceLimit = {limit: 250, color: Colors.DARKDARKRED};
    static readonly DARKRED: IncidenceLimit = {limit: 100, color: Colors.DARKRED};
    static readonly RED: IncidenceLimit = {limit: 50, color: Colors.RED};
    static readonly ORANGE: IncidenceLimit = {limit: 25, color: Colors.ORANGE};
    static readonly YELLOW: IncidenceLimit = {limit: 5, color: Colors.YELLOW};
    static readonly GREEN: IncidenceLimit = {limit: 0, color: Colors.GREEN};
    static readonly GRAY: IncidenceLimit = {limit: Number.NEGATIVE_INFINITY, color: Colors.GRAY};
}

type Rdata = {
    date: number | null;
    r: number;
}

interface VaccineData {
    lastUpdated: string,
    vaccinated: number,
    vaccinations_per_1k: number,
    quote: number,
    difference: number,
    second_vaccination: {
        vaccinated: number,
        difference: number,
        quote: number,
    }
}

type MetaBase = {
    name: string,
    short?: string,
}

type MetaCountry = MetaBase & {
    r: Rdata,
    EWZ: number,
    vaccine?: VaccineData
}

type MetaState = MetaBase & {
    BL_ID: string,
    BL: string,
    EWZ: number,
    vaccine?: VaccineData
}

type MetaArea = MetaBase & {
    RS: string,
    IBZ: number,
    cases: number,
    cases_per_100k: number,
    EWZ: number,
    last_update: string,
    BL_ID: string,
    BL: string,
    EWZ_BL: number,
    cases7_bl_per_100k: number,
    cases7_per_100k?: number,
}

interface ApiMetaArea {
    GEN: string,
    RS: string,
    IBZ: number,
    cases: number,
    cases_per_100k: number,
    EWZ: number,
    last_update: string,
    BL_ID: string,
    BL: string,
    EWZ_BL: number,
    cases7_bl_per_100k: number,
    cases7_per_100k?: number,
}

type MetaData = MetaArea | MetaState | MetaCountry

type areaDataRow =
    { status: DataStatus; data?: IncidenceData<MetaArea>; name?: string }
    | { status: DataStatus.OK; data: IncidenceData<MetaArea>, name?: string };

type IncidenceGraphData = {
    cases?: number,
    incidence?: number
}

type IncGraphValues = { cases?: number, incidence?: number };
type IncGraphMinMax = { max?: IncGraphValues, min?: IncGraphValues };

enum WidgetFamily {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
}

enum WidgetSize {
    SMALL,
    MEDIUM,
    LARGE,
}

enum Layout {
    HORIZONTAL = 'h',
    VERTICAL = 'v',
}

enum Align {
    LEFT = 'align_left',
    CENTER = 'align_center',
    RIGHT = 'align_right',
}

enum AlignContent {
    TOP = 'align_top',
    CENTER = 'align_center',
    BOTTOM = 'align_bottom',
}

type ColorValue = Color | string
type Padding = [number, number, number, number]

type TextProperties = { textColor?: ColorValue, font?: Font, textOpacity?: number, lineLimit?: number, minimumScaleFactor?: number, url?: string };
type ImageProperties = { resizable?: boolean, imageSize?: Size, imageOpacity?: number, borderWidth?: number, borderColor?: ColorValue, containerRelativeShape?: boolean, tintColor?: ColorValue, url?: string, align?: Align };
type StackPropertiesInherit = { font?: Font, textColor?: ColorValue, }
type StackProperties =
    StackPropertiesInherit
    & { layout?: Layout, bgColor?: ColorValue, spacing?: number, size?: Size, cornerRadius?: number, borderWidth?: number, borderColor?: ColorValue, url?: string, bgImage?: Image, bgGradient?: LinearGradient, alignContent?: AlignContent, padding?: Padding };

interface StackLike {
    backgroundColor: Color;
    backgroundImage: Image;
    backgroundGradient: LinearGradient;
    spacing: number;
    url: string;
    addText: (text: string) => WidgetText;
    addDate: (date: Date) => WidgetDate
    addImage: (image: Image) => WidgetImage
    addSpacer: (length?: number) => WidgetSpacer
    addStack: () => WidgetStack
    setPadding: (top: number, leading: number, bottom: number, trailing: number) => void
    useDefaultPadding: () => void
}

abstract class StackLikeWrapper<T extends StackLike> implements StackLike {
    protected elem: T;
    font?: Font;
    textColor?: ColorValue;

    protected constructor(elem: T, font?: Font, textColor?: ColorValue) {
        this.elem = elem;
        this.font = font;
        this.textColor = textColor;
    }

    get backgroundColor(): Color {
        return this.elem.backgroundColor;
    }

    set backgroundColor(value: Color) {
        this.elem.backgroundColor = value;
    }

    get backgroundGradient(): LinearGradient {
        return this.elem.backgroundGradient;
    }

    set backgroundGradient(value: LinearGradient) {
        this.elem.backgroundGradient = value;
    }

    get backgroundImage(): Image {
        return this.elem.backgroundImage;
    }

    set backgroundImage(value: Image) {
        this.elem.backgroundImage = value;
    }

    get spacing(): number {
        return this.elem.spacing;
    }

    set spacing(value: number) {
        this.elem.spacing = value;
    }

    get url(): string {
        return this.elem.url;
    }

    set url(value: string) {
        this.elem.url = value;
    }

    addDate(date: Date, properties: TextProperties = {}): WidgetDate {
        const widgetDate = this.elem.addDate(date);
        return CustomWidgetStack.applyTextProperties2Element(widgetDate, this.inheritProperties(properties));

    }

    addImage(image: Image, properties: ImageProperties = {}): WidgetImage {
        const {
            resizable,
            imageSize,
            imageOpacity,
            borderWidth,
            borderColor,
            containerRelativeShape,
            tintColor,
            url,
            align
        } = properties;

        const widgetImage = this.elem.addImage(image);
        if (resizable) widgetImage.resizable = resizable;
        if (imageSize) widgetImage.imageSize = imageSize;
        if (imageOpacity) widgetImage.imageOpacity = imageOpacity;
        if (borderWidth) widgetImage.borderWidth = borderWidth;
        if (borderColor) UI.setColorOfElementByIndex(widgetImage, 'borderColor', borderColor);
        if (containerRelativeShape) widgetImage.containerRelativeShape = containerRelativeShape;
        if (tintColor) UI.setColorOfElementByIndex(widgetImage, 'tintColor', tintColor);
        if (url) widgetImage.url = url;
        if (align === Align.LEFT) {
            widgetImage.leftAlignImage();
        } else if (align === Align.CENTER) {
            widgetImage.centerAlignImage();
        } else if (align === Align.RIGHT) {
            widgetImage.rightAlignImage();
        }

        return widgetImage
    }

    addSpacer(length?: number): WidgetSpacer {
        return this.elem.addSpacer(length)
    }

    addStack(properties: StackProperties = {}): CustomWidgetStack {
        return new CustomWidgetStack(this.elem.addStack(), this.inheritProperties(properties));
    }

    addText(text: string, properties: TextProperties = {}): WidgetText {
        const widgetText = this.elem.addText(text);
        return StackLikeWrapper.applyTextProperties2Element(widgetText, this.inheritProperties(properties));
    }

    setPadding(top: number, leading: number, bottom: number, trailing: number): void {
        this.elem.setPadding(top, leading, bottom, trailing);
    }

    useDefaultPadding(): void {
        this.elem.useDefaultPadding();
    }

    private inheritProperties<T extends { font?: Font, textColor?: ColorValue }>(params: T): T {
        // 'Children' inherit font and text color
        if (!params.font) params.font = this.font;
        if (!params.textColor) params.textColor = this.textColor;
        return params;
    }

    protected static applyTextProperties2Element<T extends WidgetText | WidgetDate>(elem: T, properties: TextProperties = {}): T {
        const {textOpacity, textColor, url, lineLimit, minimumScaleFactor, font} = properties;
        if (textColor) UI.setColorOfElementByIndex(elem, 'textColor', textColor)
        if (font) elem.font = font;
        if (textOpacity) elem.textOpacity = textOpacity;
        if (lineLimit) elem.lineLimit = lineLimit;
        if (minimumScaleFactor) elem.minimumScaleFactor = minimumScaleFactor;
        if (url) elem.url = url;
        return elem
    }

}

/**
 * Wrapper around {@link WidgetStack} to allow setting of properties when adding {@link WidgetText}, {@link WidgetDate}, {@link WidgetImage} or {@link WidgetStack}.
 * Content of created Stacks with `addStack()` will be center-align by default.
 */

class CustomWidgetStack extends StackLikeWrapper<WidgetStack> implements WidgetStack {
    font?: Font
    textColor?: ColorValue

    constructor(stack: WidgetStack, params: StackProperties = {}) {
        const {
            font,
            textColor,
        } = params;
        super(stack, font, textColor);
        CustomWidgetStack.applyParameters2Stack(this, params);

    }

    get size(): Size {
        return this.elem.size;
    }

    set size(size: Size) {
        this.elem.size = size;
    }

    get cornerRadius(): number {
        return this.elem.cornerRadius;
    }

    set cornerRadius(radius: number) {
        this.elem.cornerRadius = radius;
    }

    get borderWidth(): number {
        return this.elem.borderWidth;
    }

    set borderWidth(width: number) {
        this.elem.borderWidth = width;
    }

    get borderColor(): Color {
        return this.elem.borderColor
    }

    set borderColor(color: Color) {
        this.elem.borderColor = color
    }

    static applyParameters2Stack(stack: CustomWidgetStack, properties: StackProperties = {}): CustomWidgetStack {
        const {
            layout,
            font,
            textColor,
            bgColor,
            spacing,
            size,
            cornerRadius,
            borderWidth,
            borderColor,
            url,
            bgImage,
            bgGradient,
            alignContent,
            padding
        } = properties

        if (size) stack.size = size;


        if (layout === Layout.HORIZONTAL) {
            stack.layoutHorizontally();
        } else if (layout === Layout.VERTICAL) {
            stack.layoutVertically();
        }

        if (alignContent === AlignContent.TOP) {
            stack.topAlignContent();
        } else if (alignContent === AlignContent.CENTER) {
            stack.centerAlignContent();
        } else if (alignContent === AlignContent.BOTTOM) {
            stack.bottomAlignContent();
        } else {
            // default
            stack.centerAlignContent();
        }

        if (font) stack.font = font;
        if (textColor) stack.textColor = textColor;

        if (bgColor) stack.setBackgroundColor(bgColor);
        if (bgImage) stack.backgroundImage = bgImage;
        if (bgGradient) stack.backgroundGradient = bgGradient;
        if (spacing) stack.spacing = spacing;
        if (cornerRadius) stack.cornerRadius = cornerRadius;
        if (borderWidth) stack.borderWidth = borderWidth;
        if (borderColor) stack.setBorderColor(borderColor);
        if (url) stack.url = url;
        if (padding) stack.setPadding(...padding);

        return stack
    }

    bottomAlignContent(): void {
        this.elem.bottomAlignContent();
    }

    centerAlignContent(): void {
        this.elem.centerAlignContent();
    }

    layoutHorizontally(): void {
        this.elem.layoutHorizontally();
    }

    layoutVertically(): void {
        this.elem.layoutVertically();
    }

    topAlignContent(): void {
        this.elem.topAlignContent();
    }

    setBackgroundColor(color: ColorValue): void {
        UI.setColorOfElementByIndex(this.elem, 'backgroundColor', color);
    }

    setBorderColor(color: ColorValue): void {
        UI.setColorOfElementByIndex(this.elem, 'borderColor', color);
    }

}

abstract class CustomListWidget extends StackLikeWrapper<ListWidget> implements ListWidget {
    size: number
    family: WidgetFamily | null
    protected readonly parameters: string;
    font?: Font
    textColor?: ColorValue


    protected constructor(parameters: string, family: string, font?: Font, textColor?: ColorValue) {
        super(new ListWidget(), font, textColor);
        this.parameters = parameters;

        if (CustomListWidget.isWidgetFamily(family)) {
            console.log('Setting size by family.');
            this.setSizeByWidgetFamily(family);
        } else {
            console.warn(`Unknown widget family '${family}'.`)
        }

        this.font = font;
        this.textColor = textColor;

    }

    setSizeByWidgetFamily(family: WidgetFamily | null): void {
        this.family = family;
        switch (family) {
            case WidgetFamily.SMALL:
                this.size = WidgetSize.SMALL;
                break;
            case WidgetFamily.MEDIUM:
                this.size = WidgetSize.MEDIUM;
                break;
            case WidgetFamily.LARGE:
                this.size = WidgetSize.LARGE;
                break;
            default:
                this.size = WidgetSize.MEDIUM;
                break;
        }
    }

    abstract fillWidget(): Promise<void>;

    abstract setup(): Promise<void>;

    async init(): Promise<ListWidget> {
        await this.setup();
        await this.fillWidget();

        // this.setPadding(0);
        if (!config.runsInWidget) {
            await this.present();
        }

        return this.elem;
    }

    isLarge(): boolean {
        return CustomListWidget.isLarge(this.size);
    }

    isMedium(): boolean {
        return CustomListWidget.isMedium(this.size);
    }

    isSmall(): boolean {
        return CustomListWidget.isSmall(this.size);
    }

    static isLarge(size: WidgetSize): boolean {
        return size === WidgetSize.LARGE;
    }

    static isMedium(size: WidgetSize): boolean {
        return size === WidgetSize.MEDIUM;
    }

    static isSmall(size: WidgetSize): boolean {
        return size === WidgetSize.SMALL;
    }

    static isWidgetFamily(family: string): family is WidgetFamily {
        return Object.values(WidgetFamily).includes(family as WidgetFamily);
    }

    get refreshAfterDate(): Date {
        return this.elem.refreshAfterDate;
    }

    set refreshAfterDate(date: Date) {
        this.elem.refreshAfterDate = date;
    }

    setSizeByParameterCount(count: number): void {
        if (count < 0) {
            throw `count must be at least 0 (is: ${count})`;
        } else if (count < 2) {
            this.size = WidgetSize.SMALL;
        } else if (count < 3) {
            this.size = WidgetSize.MEDIUM;
        } else if (count <= 6) {
            this.size = WidgetSize.LARGE;
        } else {
            this.size = WidgetSize.LARGE;
            console.warn(`count larger than 6 (${count})`);
        }
    }

    presentLarge(): Promise<void> {
        return Promise.resolve(this.elem.presentLarge());
    }

    presentMedium(): Promise<void> {
        return Promise.resolve(this.elem.presentMedium());
    }

    presentSmall(): Promise<void> {
        return Promise.resolve(this.elem.presentSmall());
    }

    async present(): Promise<void> {
        if (this.isLarge()) {
            await this.presentLarge();
        } else if (this.isMedium()) {
            await this.presentMedium();
        } else if (this.isSmall()) {
            await this.presentSmall();
        } else {
            // medium as default
            await this.presentMedium();
        }
    }

}

function emptyImage(): Image {
    return Image.fromData(Data.fromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAgcBApocMXEAAAAASUVORK5CYII='));
}

class StatusBlockStack extends CustomWidgetStack {
    private readonly showText: boolean
    private readonly iconText: WidgetText
    private readonly textText?: WidgetText

    constructor(stack: WidgetStack, status?: DataStatus, showText = false, size?: Size) {
        super(stack, {layout: Layout.VERTICAL, font: CustomFont.SMALL, size});
        this.showText = showText;

        this.iconText = this.addText('');
        if (this.showText) this.textText = this.addText('', {font: CustomFont.XSMALL, textColor: '#999999'});

        if (status) this.setStatus(status);

    }

    setIcon(icon: string): void {
        this.iconText.text = icon;
    }

    setText(text: string): void {
        if (this.textText) this.textText.text = text;
    }

    setStatus(dataStatus?: DataStatus, location?: CustomLocation): void {
        let icon: string;
        let text: string;
        if (location && location.type === LocationType.CURRENT) {
            if (dataStatus === DataStatus.OK) {
                [icon, text] = UI.getLocStatusIconAndText(location.status, location.type);
            } else if (dataStatus === DataStatus.CACHED) {
                [icon, text] = UI.getLocStatusIconAndText(LocationStatus.CACHED, location.type);
            } else {
                [icon, text] = UI.getStatusIconAndText(dataStatus);
            }
        } else {
            [icon, text] = UI.getStatusIconAndText(dataStatus);
        }

        if (icon && text) {
            this.setIcon(icon);
            if (this.showText) this.setText(text);
        }
    }
}

class IncidenceContainer extends CustomWidgetStack {
    private readonly part0: WidgetText
    private readonly part1: WidgetText
    private readonly arrowText: WidgetText

    constructor(stack: WidgetStack, incidence?: number, font: CustomFont = CustomFont.NORMAL, fontSizeOffset?: number,
                arrow?: TrendArrow, fontArrow?: Font, size?: Size) {
        super(stack, {layout: Layout.HORIZONTAL, font, size,});

        const fontSmaller = font.newSizedByOffset(fontSizeOffset ?? 0);

        this.part0 = this.addText('', {font, lineLimit: 1, minimumScaleFactor: 1});
        this.part1 = this.addText('', {font: fontSmaller, lineLimit: 1, minimumScaleFactor: 0.5})

        // this.addSpacer(); // align arrow right
        this.arrowText = this.addText('', {font: fontArrow, lineLimit: 1, minimumScaleFactor: 1})

        // this.addSpacer(); // align all left

        if (incidence) this.setIncidence(incidence)
        if (arrow) this.setArrow(arrow)

    }

    setIncidence(incidence?: number): void {
        const color = UI.getIncidenceColor(incidence);
        this.part0.textColor = color;
        this.part1.textColor = color;
        if (incidence) {
            if (Math.round(incidence) < 100) {
                const _incidence = Math.round(incidence * 10) / 10;
                const num = Math.floor(_incidence);
                const decimal = Math.abs(_incidence) - num;

                this.part0.text = '' + num;
                this.part1.text = decimal >= 0 ? Format.number(decimal, 1).substring(1) : '';
            } else {
                this.part0.text = '' + Math.round(incidence);
                this.part1.text = ''
            }
        } else {
            this.part0.text = 'n/v';
            this.part1.text = '';
        }
    }

    setArrow(arrow: TrendArrow): void {
        this.arrowText.text = arrow;
        this.arrowText.textColor = UI.getTrendArrowColor(arrow);
    }
}

class HistoryCasesStack extends CustomWidgetStack {
    private readonly graphImage: WidgetImage;
    private readonly casesText: WidgetText;
    private readonly graphSize: Size;

    constructor(stack: WidgetStack, graphSize: Size, font?: Font, properties: { spacing?: number, size?: Size, padding?: Padding, align?: Align, imageOpacity?: number, graphResizable?: boolean } = {spacing: 1,}) {
        const {spacing, padding, align, imageOpacity, graphResizable} = properties;

        const size: Size = properties.size ?? new Size(graphSize.width, 0);
        super(stack, {layout: Layout.VERTICAL, spacing, font, padding, size});
        this.graphSize = graphSize;

        this.graphImage = this.addImage(emptyImage(), {imageOpacity});
        this.graphResizable = graphResizable ?? false;

        const casesStack = this.addStack({layout: Layout.HORIZONTAL});

        if (align === undefined || align === Align.RIGHT || align === Align.CENTER) casesStack.addSpacer();
        this.casesText = casesStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.9});
        if (align === Align.LEFT || align === Align.CENTER) casesStack.addSpacer();
    }

    setCases(cases?: number): void {
        //console.log(`HistoryCasesStack.setCases: cases: ${cases}`);
        this.casesText.text = cases !== undefined && cases >= 0 ? '+' + cases : 'n/v';
    }

    setGraph(data: IncidenceGraphData[], minmax?: IncGraphMinMax): void {
        this.graphImage.image = UI.generateGraph(data, this.graphSize, minmax, CFG.def.graphShowIndex, 'incidence', Align.RIGHT).getImage();
    }

    set graphResizable(resizable: boolean) {
        this.graphImage.resizable = resizable;
    }

    get graphResizable(): boolean {
        return this.graphImage.resizable;
    }
}

abstract class IncidenceRowStackBase extends CustomWidgetStack {
    protected incidenceContainer: IncidenceContainer;
    protected nameText: WidgetText;
    protected graphSize: Size;
    protected trendStack: HistoryCasesStack;

    protected constructor(stack: WidgetStack, layout?: Layout, bgColor?: ColorValue, size?: Size, cornerRadius?: number, padding?: Padding) {
        super(stack, {layout, bgColor, size, cornerRadius, padding,});
    }

    setName(name: string): void {
        this.nameText.text = name.toUpperCase();
    }

    setCases(cases?: number): void {
        this.trendStack.setCases(cases);
        // this.casesText.text = cases !== undefined ? '+' + Format.number(cases) : 'n/v';
    }

    setGraph(data: IncidenceGraphData[], minmax?: IncGraphMinMax): void {
        this.trendStack.setGraph(data, minmax);
        // this.graphImage.image = UI.generateGraph(data, this.graphSize, {}, maxValues, CFG.def.graphShowIndex, 'incidence', Align.RIGHT).getImage();
    }

    setIncidence(data: IncidenceData<MetaCountry | MetaState>, incidenceTrend: IncidenceTrend): void {
        const incidence = data.getDay()?.incidence ?? 0; // TODO check default value
        const offset = incidenceTrend === IncidenceTrend.DAY ? 1 : 7;
        const incidence1 = data.getDay(offset)?.incidence ?? 0;
        const arrow = UI.getTrendArrow(incidence, incidence1);

        this.incidenceContainer.setIncidence(incidence)
        this.incidenceContainer.setArrow(arrow)
    }

    setData(data: IncidenceData<MetaCountry | MetaState>, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        const meta = data.meta;
        this.setName(this.mapMeta2Name(meta));
        this.setCases(data.getDay()?.cases);
        this.setIncidence(data, incidenceTrend);
        this.setGraph(data.data, minmax);
    }

    mapMeta2Name(meta: MetaCountry | MetaState): string {
        return meta.short ?? meta.name;
    }
}

abstract class IncidenceVaccineRowStackBase extends IncidenceRowStackBase {
    protected vaccineIconText: WidgetText;
    protected vaccineQuoteText: WidgetText;
    protected vaccinatedText?: WidgetText;
    protected vaccineQuote2ndText: WidgetText;

    protected constructor(stack: WidgetStack, layout?: Layout, bgColor?: ColorValue, size?: Size, cornerRadius?: number, padding?: Padding) {
        super(stack, layout, bgColor, size, cornerRadius, padding);
    }

    protected setVaccineQuote(quote: number): void {
        this.vaccineQuoteText.text = quote > 0 ? Format.number(quote, 2) + '%' : 'n/v';
    }

    protected setVaccineQuote2nd(quote: number): void {
        this.vaccineQuote2ndText.text = quote > 0 ? '(' + Format.number(quote, 2) + '%)' : '';
    }

    protected setVaccinated(vaccinated: number): void {
        if (this.vaccinatedText) this.vaccinatedText.text = ' (' + Format.number(vaccinated) + ')';
    }

    setVaccineData(data: VaccineData): void {
        this.vaccineIconText.text = '💉';
        this.setVaccinated(data.vaccinated);
        this.setVaccineQuote(data.quote);
        //this.setVaccineQuote2nd(data.second_vaccination.quote);
    }

    setData(data: IncidenceData<MetaCountry | MetaState>, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        super.setData(data, incidenceTrend, minmax);
        if (data.meta.vaccine) {
            this.setVaccineData(data.meta.vaccine);
        }
    }
}

class SmallIncidenceRowStack extends IncidenceVaccineRowStackBase {
    constructor(stack: WidgetStack, data?: IncidenceData<MetaCountry | MetaState>, incidenceTrend?: IncidenceTrend, minmax?: IncGraphMinMax, bgColor: ColorValue = '#99999915') {
        super(stack, Layout.HORIZONTAL, bgColor, undefined, 8, [2, 0, 1, 4]);
        this.textColor = '#999999';

        const ht = 12;
        const hb = 12;

        const width = 145;
        const wl = 76;
        const spacing = 5;
        const wr = width - wl - spacing;

        this.graphSize = new Size(wr, ht - 1);

        const c0 = this.addStack({layout: Layout.VERTICAL, size: new Size(wl, 0),});
        const nameStack = c0.addStack({layout: Layout.HORIZONTAL, size: new Size(0, ht - 1)});
        const vaccineStack = c0.addStack({layout: Layout.HORIZONTAL, size: new Size(0, hb), font: CustomFont.XSMALL});
        this.addSpacer(spacing);
        this.trendStack = new HistoryCasesStack(this.addStack(), this.graphSize, CustomFont.XSMALL, {
            spacing: 1,
            size: new Size(wr, ht + hb),
            graphResizable: false,
            imageOpacity: 0.8,
        });

        // Incidence | Trend | Name
        nameStack.addSpacer(); // align incidence right
        this.incidenceContainer = new IncidenceContainer(nameStack.addStack(), undefined, CustomFont.medium(12), -1);
        nameStack.addSpacer(2);
        this.nameText = nameStack.addText('', {font: CustomFont.NORMAL});

        // Vaccine
        vaccineStack.addSpacer();
        this.vaccineIconText = vaccineStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.9});
        vaccineStack.addSpacer(0);
        this.vaccineQuoteText = vaccineStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.9});
        vaccineStack.addSpacer(1);
        this.vaccineQuote2ndText = vaccineStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.5});

        if (data) {
            if (!incidenceTrend) console.warn('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }
}

class SmallIncidenceBlockStack extends IncidenceRowStackBase {
    constructor(stack: WidgetStack, data?: IncidenceData<MetaData>, incidenceTrend?: IncidenceTrend, minmax?: IncGraphMinMax) {
        super(stack, Layout.VERTICAL, '#99999915', undefined, 8, [2, 0, 2, 4]);
        this.textColor = '#777777';

        const row0 = this.addStack({layout: Layout.HORIZONTAL});
        row0.addSpacer(); // align text right

        this.incidenceContainer = new IncidenceContainer(row0.addStack(), undefined, CustomFont.SMALL2, -1);
        this.nameText = row0.addText('', {
            font: CustomFont.SMALL2,
            lineLimit: 1,
            minimumScaleFactor: 1
        });

        const row1 = this.addStack({layout: Layout.HORIZONTAL});
        row1.addSpacer();
        this.trendStack = new HistoryCasesStack(row1.addStack(), new Size(58, 10), CustomFont.XSMALL, {
            imageOpacity: 0.9,
            graphResizable: false,
        });

        if (data) {
            if (!incidenceTrend) console.log('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }

    mapMeta2Name(meta: MetaCountry | MetaState): string {
        return meta[ENV.state.nameIndex];
    }
}

class HeaderStack extends CustomWidgetStack {
    private readonly titleText: WidgetText;
    private readonly smallIncidenceRow: SmallIncidenceRowStack;
    private readonly statusBlock: StatusBlockStack;
    private readonly rText: WidgetText;
    private readonly shownText: WidgetText;
    private readonly dateText: WidgetText;
    private readonly isSmall: boolean;

    constructor(stack: WidgetStack, size: WidgetSize, title?: string, rValue?: number, type?: string, date?: Date) {
        super(stack, {layout: Layout.HORIZONTAL});

        this.isSmall = CustomListWidget.isSmall(size);

        this.titleText = this.addText('', Font.mediumSystemFont(22));
        this.addSpacer(3);
        const middleStack = this.addStack({layout: Layout.VERTICAL});
        this.addSpacer();
        if (this.isSmall) {
            // add status block
            this.statusBlock = new StatusBlockStack(this.addStack());
        } else {
            // add GER block
            this.smallIncidenceRow = new SmallIncidenceRowStack(this.addStack(), undefined, undefined, undefined, '#99999900');
            this.smallIncidenceRow.mapMeta2Name = function (meta: MetaCountry | MetaArea) {
                return meta.short ?? meta.name
            }
        }

        // R
        const rStack = middleStack.addStack({layout: Layout.HORIZONTAL});
        this.rText = rStack.addText('', {font: CustomFont.MEDIUM});
        rStack.addSpacer(2);

        const info = {font: CustomFont.XSMALL, textColor: '#777777'};
        //const infoStack = rStack.addStack({layout: Layout.VERTICAL, font: CustomFont.XSMALL, textColor: '#777777'});
        this.shownText = rStack.addText('', info);
        this.dateText = middleStack.addText('', info);


        if (title) this.setTitle(title)
        if (rValue) this.setRValue(rValue);
        if (type) this.setTypeText(type);
        if (date) this.setDateText(date);
    }

    setTitle(text: string): void {
        this.titleText.text = text;
    }

    setRValue(value: number): void {
        this.rText.text = value > 0 ? Format.number(value, 2) + 'ᴿ' : 'n/v';
    }

    setTypeText(text: string): void {
        this.shownText.text = `RKI (${text})`;
    }

    setDateText(date?: Date | number): void {
        this.dateText.text = date !== undefined ? Format.dateStr(date) + ' ' + Format.timeStr(Date.now()) : 'n/v';
    }

    setStatus(dataStatus?: DataStatus, location?: CustomLocation): void {
        if (this.isSmall) {
            this.statusBlock.setStatus(dataStatus, location);
        } else {
            console.warn('Status cannot be set. Widget is not small.');
        }
    }

    setCountryData(data: IncidenceData<MetaCountry | MetaState>, incidenceTrend: IncidenceTrend,): void {
        if (this.isSmall) {
            console.warn('CountryData cannot be set. Widget is small.');
        } else {
            this.smallIncidenceRow.setData(data, incidenceTrend);
        }
    }
}

class AreaIconStack extends CustomWidgetStack {
    private readonly iconText: WidgetText;

    constructor(stack: WidgetStack, areaIBZ?: number) {
        super(stack, {
            layout: Layout.HORIZONTAL,
            font: CustomFont.XSMALL,
            cornerRadius: 2,
            borderWidth: 2,
            borderColor: '#99999930',
            padding: [1, 3, 1, 3]
        });
        this.iconText = this.addText('');

        if (areaIBZ) this.setAreaIBZ(areaIBZ);
    }

    setAreaIBZ(areaIBZ: number): void {
        this.iconText.text = UI.getAreaIcon(areaIBZ);
    }

}

class AreaRowStack extends IncidenceRowStackBase {
    private readonly widgetSize: WidgetSize;
    private readonly statusBlock: StatusBlockStack;
    private readonly areaIconStack: AreaIconStack;
    private readonly elementDepth?: number;

    constructor(stack: WidgetStack, widgetSize: WidgetSize, data?: IncidenceData<MetaArea>, incidenceTrend?: IncidenceTrend, status?: DataStatus, name?: string, minmax?: IncGraphMinMax, padding?: Padding, cornerRadius = 10, elemDepth?: number) {
        const isSmall = CustomListWidget.isSmall(widgetSize)
        super(stack, Layout.VERTICAL, undefined, undefined, cornerRadius);
        this.elementDepth = elemDepth;
        this.widgetSize = widgetSize;
        this.graphSize = new Size(isSmall ? 61 : 84, 16);

        const row0 = this.addStack({
            layout: Layout.HORIZONTAL,
            cornerRadius: cornerRadius,
            padding: padding,
        });

        // Incidence (font 26, smaller 18)
        this.incidenceContainer = new IncidenceContainer(row0.addStack(), undefined, CustomFont.boldMono(26), -6, undefined, CustomFont.boldRounded(20), new Size(72, 0));

        const bgColor: ColorValue = elemDepth ? UI.elementDepth2BgColor(elemDepth) : '#99999920';

        // Name
        let nameStack: CustomWidgetStack;
        let minScale: number;
        if (isSmall) {
            this.setBackgroundColor(bgColor);
            row0.setBackgroundColor(UI.elementDepth2BgColor((this.elementDepth ?? -2) + 1));
            nameStack = this.addStack({
                layout: Layout.HORIZONTAL,
                font: CustomFont.MEDIUM,
                padding: [4, 0, 2, 0],
                bgColor,
            });
            minScale = 0.9;
            nameStack.addSpacer();
        } else {
            row0.setBackgroundColor(bgColor);
            nameStack = row0.addStack({layout: Layout.HORIZONTAL, font: CustomFont.MEDIUM});
            minScale = 1;
            nameStack.addSpacer(5);
        }

        this.areaIconStack = new AreaIconStack(nameStack.addStack());
        nameStack.addSpacer(3);
        this.nameText = nameStack.addText('', {lineLimit: 1, minimumScaleFactor: minScale});

        if (isSmall) nameStack.addSpacer();

        row0.addSpacer();

        if (!CustomListWidget.isSmall(widgetSize)) {
            this.statusBlock = new StatusBlockStack(row0.addStack(), undefined, false);
            row0.addSpacer(5);
        }

        this.trendStack = new HistoryCasesStack(row0.addStack({textColor: '#888888'}), this.graphSize, CustomFont.XSMALL);

        if (status) this.setStatus(status, data?.location);
        if (data) {
            if (!incidenceTrend) console.warn('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
            const meta = data.meta;
            const areaName = name && name.length > 0 ? name : meta.name;
            this.setName(areaName);
        } else if (name) {
            this.setName(name);
        }
    }

    setStatus(dataStatus: DataStatus, location?: CustomLocation): void {
        if (this.statusBlock && (dataStatus !== DataStatus.OK || location?.type === LocationType.CURRENT)) {
            this.statusBlock.setStatus(dataStatus, location);
        }
    }

    setAreaIBZ(areaIBZ: number): void {
        this.areaIconStack.setAreaIBZ(areaIBZ);
    }

    setData(data: IncidenceData<MetaArea>, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        super.setData(data, incidenceTrend, minmax);
        this.setAreaIBZ(data.meta.IBZ);
    }
}

class AreaErrorRowStack extends AreaRowStack {

    constructor(stack: WidgetStack, widgetSize: WidgetSize, status: DataStatus, name?: string, padding?: Padding, cornerRadius?: number, elemDepth?: number) {
        super(stack, widgetSize, undefined, undefined, status, name, undefined, padding, cornerRadius, elemDepth);

    }

    addDummyData() {
        const dummyGraphData: IncidenceGraphData[] = [];
        for (let i = 0; i < 21; i++) {
            dummyGraphData.push({cases: 0, incidence: 0});
        }

        this.setGraph(dummyGraphData);
        this.incidenceContainer.setIncidence(undefined);
        this.setCases(undefined);
    }
}

class StateRowStack extends IncidenceVaccineRowStackBase {
    protected vaccinatedText: WidgetText;

    constructor(stack: WidgetStack, data?: IncidenceData<MetaState>, incidenceTrend?: IncidenceTrend, minmax?: IncGraphMinMax, bgColor?: ColorValue, padding?: Padding) {
        super(stack, Layout.HORIZONTAL, bgColor, undefined, undefined, padding);
        this.textColor = '#888888';

        this.graphSize = new Size(84, 16); //new Size(71, 11);

        this.nameText = this.addText('', {lineLimit: 1, minimumScaleFactor: 1, font: CustomFont.MEDIUM});
        this.addSpacer(2);
        this.incidenceContainer = new IncidenceContainer(this.addStack(), undefined, CustomFont.boldMono(12), -1, undefined, CustomFont.boldRounded(12));
        this.addSpacer();
        const vaccineStack = this.addStack({layout: Layout.HORIZONTAL, font: CustomFont.SMALL, spacing: 1,});
        this.addSpacer();
        this.trendStack = new HistoryCasesStack(this.addStack(), this.graphSize, CustomFont.XSMALL, {
            spacing: 1,
            graphResizable: false,
            imageOpacity: 0.75,
        });

        // Vaccine
        this.vaccineIconText = vaccineStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.9});
        this.vaccineQuoteText = vaccineStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.9});
        this.vaccineQuote2ndText = vaccineStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.8});
        this.vaccinatedText = vaccineStack.addText('', {lineLimit: 1, minimumScaleFactor: 0.9});

        if (data) {
            if (!incidenceTrend) console.warn('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }

    setData(data: IncidenceData<MetaCountry | MetaState>, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        super.setData(data, incidenceTrend, minmax);
        if (data.meta.vaccine) {
            this.setVaccineData(data.meta.vaccine);
        }
    }
}

class MultiAreaRowStack extends CustomWidgetStack {
    private readonly widgetSize: WidgetSize;
    private readonly areaStacks: CustomWidgetStack;
    private readonly stateStack: StateRowStack;
    private readonly areas: Map<string, AreaRowStack>;
    private readonly elementDepth: number;

    constructor(stack: WidgetStack, widgetSize: WidgetSize, elementDepth: number, dataRows?: areaDataRow[], state?: IncidenceData<MetaState>, incidenceTrend?: IncidenceTrend, minmax?: IncGraphMinMax) {
        const bgColor = UI.elementDepth2BgColor(elementDepth);
        super(stack, {layout: Layout.VERTICAL, cornerRadius: 10, spacing: 1, bgColor});
        this.elementDepth = elementDepth;
        this.widgetSize = widgetSize;
        this.areas = new Map();

        this.stateStack = new StateRowStack(this.addStack(), state, incidenceTrend, minmax, undefined, [2, 4, 2, 4]);
        this.areaStacks = this.addStack({layout: Layout.VERTICAL, spacing: 1});

        if (dataRows) {
            if (!incidenceTrend) console.warn('incidenceTrend not set');
            this.addAreas(dataRows, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }

    setArea(dataRow: areaDataRow, incidenceTrend: IncidenceTrend): void {
        const areaData = dataRow.data;
        if (!areaData) {
            console.warn('MultiAreaRowStack.setArea: dataRow has no data.');
            return;
        }
        const id = areaData.id;
        const areaStack = this.areas.get(id);
        if (!areaStack) {
            console.warn(`Area with id ${id} has not been added. Use addArea instead.`);
            return;
        }
        areaStack.setData(areaData, incidenceTrend);
        areaStack.setStatus(dataRow.status);
        // TODO set name
    }

    addArea(dataRow: areaDataRow, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        const areaData = dataRow.data;
        if (!areaData) {
            console.warn('MultiAreaRowStack.addArea: dataRow has no data.');
            return;
        }
        const id = areaData.id;

        let areaStack = this.areas.get(id);
        if (areaStack) {
            console.log(`Area with id ${id} already added. Updating data.`);
            return this.setArea(dataRow, incidenceTrend);
        }

        const padding: [number, number, number, number] = CustomListWidget.isSmall(this.widgetSize) ? [4, 4, 4, 4] : [2, 4, 2, 4];
        areaStack = new AreaRowStack(this.areaStacks.addStack(), this.widgetSize, dataRow.data, incidenceTrend, dataRow.status, dataRow.name, minmax, padding, 0, this.elementDepth + 1);
        this.areas.set(id, areaStack);
    }

    addAreas(dataRows: areaDataRow[], incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        dataRows.forEach(row => this.addArea(row, incidenceTrend, minmax));
    }
}

abstract class ListStack<S, T> extends CustomWidgetStack {
    protected items: T[];
    protected widgetSize: WidgetSize;
    protected maxLength?: number;
    protected dynamicSpacing: boolean;

    get length(): number {
        return this.items.length;
    }

    protected constructor(stack: WidgetStack, widgetSize: WidgetSize, layout: Layout = Layout.VERTICAL, spacing?: number, maxLength?: number) {
        super(stack, {layout});

        if (spacing) {
            if (spacing < 0) {
                this.dynamicSpacing = true;
            } else {
                this.dynamicSpacing = false;
                this.spacing = spacing;
            }
        } else {
            this.dynamicSpacing = true;
        }

        this.widgetSize = widgetSize;
        this.maxLength = maxLength;
        this.items = [];
    }

    protected abstract createItem(data: S, ...args);

    protected addItem(data: S, addSpacer = true, ...args): void {
        if (this.maxLength && this.items.length >= this.maxLength) {
            console.warn('Reached max length.');
            return;
        }
        if (this.items.length !== 0 && addSpacer && this.dynamicSpacing) this.addSpacer();
        this.items.push(this.createItem(data, ...args));
    }

    protected addItems(data: S[], ...args): void {
        if (this.maxLength && data.length > this.maxLength) {
            console.warn('To many states provided.');
        } else if (data.length < 1) {
            console.warn('No states provided.');
        }
        const sliced = data.slice(0, this.maxLength);
        for (let i = 0; i < sliced.length; i++) {
            const item = sliced[i];
            this.addItem(item, undefined, ...args);
        }
    }
}

class AreaListStack extends CustomWidgetStack {
    private readonly widgetSize: WidgetSize;
    elementDepth: number;

    constructor(stack: WidgetStack, widgetSize: WidgetSize, incidenceTrend: IncidenceTrend, dataRows: areaDataRow[] = [], minmax?: IncGraphMinMax) {
        super(stack, {layout: Layout.VERTICAL, cornerRadius: 10, spacing: 2,});
        this.widgetSize = widgetSize;
        this.elementDepth = 0;
        this.addAreas(dataRows, incidenceTrend, minmax);
    }

    addAreas(dataRows: areaDataRow[], incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        dataRows.forEach(dataRow => this.addArea(dataRow, incidenceTrend, minmax));
    }

    addArea(dataRow: areaDataRow, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        const data = dataRow.data;
        const status = dataRow.status;
        const padding: [number, number, number, number] = CustomListWidget.isSmall(this.widgetSize) ? [4, 4, 4, 4] : [2, 4, 2, 4];

        const childDepth = this.elementDepth + 1;
        if (DataResponse.isSuccess(status) && data !== undefined) {
            new AreaRowStack(this.addStack(), this.widgetSize, data, incidenceTrend, status, dataRow.name, minmax, padding, 10, childDepth);
        } else {
            console.warn('Area can not be displayed. status: ' + status);
            new AreaErrorRowStack(this.addStack(), this.widgetSize, status, undefined, padding, 10, childDepth);
        }
    }

    addMultiArea(areaRows: areaDataRow[], state: IncidenceData<MetaState>, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        new MultiAreaRowStack(this.addStack(), this.widgetSize, this.elementDepth + 1, areaRows, state, incidenceTrend, minmax);
    }

    addMultiAreas(multiRows: { areaRows: areaDataRow[], state: IncidenceData<MetaState> }[], incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): void {
        multiRows.forEach(row => this.addMultiArea(row.areaRows, row.state, incidenceTrend, minmax));
    }
}

class StatesRowStack extends ListStack<IncidenceData<MetaState | MetaCountry>, IncidenceRowStackBase> {
    private readonly stateBackgroundColor: ColorValue;

    constructor(stack: WidgetStack, widgetSize: WidgetSize, spacing?: number, states: IncidenceData<MetaState | MetaCountry>[] = [], incidenceTrend?: IncidenceTrend, minmax?: IncGraphMinMax) {
        super(stack, widgetSize, Layout.HORIZONTAL, spacing, 2);
        this.items = [];
        this.stateBackgroundColor = Colors.BACKGROUND2;
        this.addItems(states, incidenceTrend, minmax);
    }

    protected createItem(data: IncidenceData<MetaState | MetaCountry>, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax) {
        if (CustomListWidget.isSmall(this.widgetSize)) {
            return new SmallIncidenceBlockStack(this.addStack({bgColor: Colors.BACKGROUND2}), data, incidenceTrend, minmax);
        } else {
            return new SmallIncidenceRowStack(this.addStack({bgColor: Colors.BACKGROUND2}), data, incidenceTrend, minmax);
        }
    }

    addState(data: IncidenceData<MetaState | MetaCountry>, incidenceTrend, IncidenceTrend, minmax?: IncGraphMinMax) {
        this.addItem(data, undefined, incidenceTrend, minmax);
    }

    addStates(data: IncidenceData<MetaState | MetaCountry>[], incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax) {
        this.addItems(data, incidenceTrend, minmax);
    }

}

class StateListStack extends ListStack<IncidenceData<MetaState | MetaCountry>[], StatesRowStack> {
    private readonly statesPerRow: number;

    constructor(stack: WidgetStack, widgetSize: WidgetSize, states: IncidenceData<MetaState | MetaCountry>[], incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax) {
        super(stack, widgetSize, Layout.VERTICAL, 4);
        this.statesPerRow = 2;

        this.addStates(states, incidenceTrend, minmax);
    }

    addState(data: IncidenceData<MetaState | MetaCountry>, incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax) {
        for (const stateRowStack of this.items) {
            if (stateRowStack.length >= this.statesPerRow) {
                continue;
            }
            stateRowStack.addState(data, incidenceTrend, minmax);
            return;
        }
        this.addItem([data], undefined, incidenceTrend, minmax);
    }

    addStates(data: IncidenceData<MetaState | MetaCountry>[], incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax) {
        for (const datum of data) {
            this.addState(datum, incidenceTrend, minmax);
        }
    }

    createItem(data: IncidenceData<MetaState | MetaCountry>[], incidenceTrend: IncidenceTrend, minmax?: IncGraphMinMax): StatesRowStack {
        return new StatesRowStack(this.addStack(), this.widgetSize, -1, data, incidenceTrend, minmax);
    }

}

class IncidenceListWidget extends CustomListWidget {
    protected locations: CustomLocation[];
    private config: WidgetConfig;
    private incidenceTrend: IncidenceTrend;
    private readonly header: HeaderStack;
    private readonly areaListStack: AreaListStack;
    private readonly stateList: StateListStack;
    private readonly api: RkiService;

    constructor(api: RkiService, parameters: string, family: string, coords: CustomLocation[] = [], cfg: WidgetConfig) {
        super(parameters, family);
        this.api = api;
        this.locations = [...CustomLocation.fromWidgetParameters(this.parameters), ...coords];
        this.config = cfg;

        if (!this.family) this.setSizeByParameterCount(this.locations.length);

        this.backgroundColor = Colors.BACKGROUND;

        if (this.isSmall()) {
            this.setPadding(4, 4, 4, 4);
        } else {
            this.setPadding(6, 6, 6, 6);
        }

        const maxShown = this.isLarge() ? 6 : this.isMedium() ? 2 : 1;

        this.header = this.addTopBar();
        this.addSpacer(5);
        this.areaListStack = this.addAreaRowsStack();
        this.addSpacer();
        this.stateList = this.addStateRowsStack();

    }

    async setup(): Promise<void> {
        this.incidenceTrend = this.config.graphShowIndex === "incidence" ? IncidenceTrend.DAY : IncidenceTrend.WEEK;
    }

    async fillWidget(): Promise<void> {
        this.header.setTypeText(CFG.def.graphShowIndex);
        const [respGer] = await Promise.all([IncidenceData.loadCountry(this.api, 'GER', this.config.showVaccine)]);
        if (respGer.succeeded() && !respGer.isEmpty()) {
            const dataGer = IncidenceData.calcIncidence(respGer.data, this.config.incidenceDisableLive);
            this.setCountry(dataGer);
        }

        // AREAS
        let currentLocation: areaDataRow | undefined;
        const areaRows: areaDataRow[] = [];
        const areaIds: string[] = [];
        const graphMinMax: IncGraphMinMax = {min: {incidence: 0, cases: 0}, max: {incidence: 0, cases: 0}};
        for (const location of this.locations) {
            const respArea = await IncidenceData.loadArea(this.api, location);
            const status = respArea.status;

            if (!respArea.succeeded() || respArea.isEmpty()) {
                console.warn('fillWidget: Loading Area failed. Status: ' + status);
                if (location.type === LocationType.CURRENT) {
                    currentLocation = {status, name: location.name};
                } else {
                    areaRows.push({status, name: location.name});
                }
                continue;
            }

            const area = respArea.data;
            const areaId = area.meta.RS;
            if (areaIds.includes(areaId) || currentLocation?.data?.meta.RS === areaId) {
                console.log(`fillWidget: skipp duplicate area. areaId: ${areaId}`);
                continue;
            }
            const areaWithIncidence = IncidenceData.calcIncidence(area, this.config.incidenceDisableLive);

            const maxValues = areaWithIncidence.getMax();

            for (const maxKey in maxValues) {
                if (Object.prototype.hasOwnProperty.call(maxValues, maxKey)) {
                    if (!graphMinMax.max) {
                        graphMinMax.max = {};
                        graphMinMax.max[maxKey] = maxValues[maxKey];
                    } else if (!graphMinMax.max[maxKey]) {
                        graphMinMax.max[maxKey] = maxValues[maxKey];
                    } else if (maxValues[maxKey] > graphMinMax.max[maxKey]) {
                        graphMinMax.max[maxKey] = maxValues[maxKey];
                    }
                }
            }

            if (location.type === LocationType.CURRENT) {
                currentLocation = {status, data: areaWithIncidence, name: location.name}
            } else {
                areaIds.push(areaId);
                areaRows.push({
                    status,
                    data: areaWithIncidence,
                    name: location.name,
                });
            }

        }

        const areaRowsFiltered = areaRows.filter(elem => elem.data?.meta.RS !== currentLocation?.data?.meta.RS);
        if( currentLocation){
            areaRowsFiltered.unshift(currentLocation);
        }

        console.log('IncidenceListWidget.fillWidget: MaxValues: ' + JSON.stringify(graphMinMax));

        if (this.isSmall()) {
            const {status: dataStatus, data} = areaRowsFiltered[0];
            this.setStatus(dataStatus, data?.location);
        }

        // STATES

        const processed = {};
        const states: IncidenceData<MetaState>[] = [];
        for (const row of areaRowsFiltered.filter(row => row.data !== undefined)) {
            if (row.data === undefined) {
                continue;
            }
            const meta = row.data.meta;
            const id = meta.BL_ID;
            if (processed[id]) continue; // skip duplicated areaRows
            const resp = await IncidenceData.loadState(this.api, id, meta.BL, meta.EWZ_BL, this.config.showVaccine);

            if (!resp.isEmpty() && resp.succeeded()) {
                states.push(IncidenceData.calcIncidence(resp.data, this.config.incidenceDisableLive));
                processed[id] = true;
            } else {
                console.warn(`Loading state failed. status: ${resp.status}`);
            }
        }

        if (this.isLarge() && this.config.alternateLarge) {
            const multiRows = Helper.aggregateToMultiRows(areaRowsFiltered, states, 8);
            this.areaListStack.addMultiAreas(multiRows, this.incidenceTrend, graphMinMax);
        } else if (this.isLarge() && !this.config.alternateLarge) {
            this.addAreas(areaRowsFiltered.slice(0, 6), graphMinMax);
            this.addStates(states);
        } else {
            this.addAreas(areaRowsFiltered, graphMinMax);
            const shownStates: IncidenceData<MetaState | MetaCountry>[] = states;
            if (this.isSmall() && respGer.succeeded() && !respGer.isEmpty()) shownStates.push(respGer.data);
            this.addStates(shownStates);
        }

        // UI ===
        if (this.config.openUrlOnTap) this.url = this.config.openUrl;
        this.refreshAfterDate = new Date(Date.now() + this.config.refreshInterval * 1000);
    }

    private addTopBar(): HeaderStack {
        return new HeaderStack(this.addStack(), this.size, '🦠');
    }

    private addAreaRowsStack(): AreaListStack {
        return new AreaListStack(this.addStack(), this.size, this.incidenceTrend);
    }

    private addStateRowsStack(): StateListStack {
        return new StateListStack(this.addStack(), this.size, [], this.incidenceTrend);
    }

    setStatus(dataStatus?: DataStatus, location?: CustomLocation): void {
        this.header.setStatus(dataStatus, location);
    }

    addArea(status: DataStatus, data?: IncidenceData<MetaArea>, name?: string, minmax?: IncGraphMinMax): void {
        this.areaListStack.addArea({status, data, name}, this.incidenceTrend, minmax);
    }

    addAreas(dataRows: { status: DataStatus, data?: IncidenceData<MetaArea>, name?: string }[], minmax?: IncGraphMinMax, showVaccine = false) {
        this.areaListStack.addAreas(dataRows, this.incidenceTrend, minmax);
    }

    addStates(states: IncidenceData<MetaState | MetaCountry>[], minmax?: IncGraphMinMax): void {
        this.stateList.addStates(states, this.incidenceTrend, minmax);
    }

    setCountry(country: IncidenceData<MetaCountry>): void {
        this.header.setRValue(country.meta.r.r);
        this.header.setDateText(country.getDay()?.date);
        if (!this.isSmall()) this.header.setCountryData(country, this.incidenceTrend);
    }
}

type IncidenceValue = IncidenceGraphData & {
    date: Date;
}

type IncidenceValueStored = IncidenceGraphData & {
    date: string;
}

class UI {
    static generateGraph(data: Record<string, number>[], size: Size, minmax: IncGraphMinMax = {}, valueIndex = 'cases', colorIndex: string | number = 'incidence',
                         align: Align = Align.LEFT, upsideDown: boolean = CFG.def.graphUpsideDown): DrawContext {
        const context = new DrawContext();
        context.size = size;
        context.opaque = false;
        context.respectScreenScale = true;
        const width = size.width;
        const height = size.height;

        const spacing = 1; // space between the bars
        const minW = 2; // minimum width of the bars
        const minH = 2; // minimum height of a bar
        // const minHeight = 10; // minimum height of the graph

        let showLen = Math.floor((width + spacing) / (minW + spacing));
        showLen = Math.min(data.length, CFG.def.maxShownDays, showLen);
        const iOffset = data.length - showLen;

        const values = data.slice(iOffset).map(o => o[valueIndex]);
        let max = Math.max(minmax.max?.[valueIndex] ?? 0, ...values);
        max = max <= 0 ? 10 : max;
        let min = Math.min(minmax.min?.[valueIndex] ?? 0, ...values);
        min = min > 0 ? 0 : min;

        const w = Math.max(2, ((width + spacing) / showLen) - spacing);

        let xOffset;
        if (align === Align.CENTER) {
            xOffset = (width - (showLen * (w + spacing))) / 2;
        } else if (align === Align.RIGHT) {
            xOffset = width - (showLen * (w + spacing) - spacing);
        } else if (align === Align.LEFT) {
            xOffset = 0;
        } else {
            // Align.LEFT as default
            xOffset = 0;
        }

        for (let i = 0; i + iOffset < data.length; i++) {
            const item = data[i + iOffset];
            let value = parseFloat(item[valueIndex].toString()); // Todo: i don't think we need to convert from number to string to number
            if (value === -1 && i === 0) value = 10;
            const h = Math.max(minH, (Math.abs(value) / max) * height);
            const x = xOffset + (w + spacing) * i;
            const y = (!upsideDown) ? height - h : 0;
            const rect = new Rect(x, y, w, h);
            context.setFillColor(
                UI.getIncidenceColor((item[valueIndex] >= 1) ? item[colorIndex] : 0),
            );
            context.fillRect(rect);
        }
        return context;
    }

    static setColorOfElementByIndex(element, index: string, color: ColorValue): void {
        if (typeof element[index] === 'undefined') {
            console.warn(`${element} has no attribute ${index}.`);
            return;
        }

        if (color instanceof Color) {
            element[index] = color;
        } else {
            const colorObj = Parse.color(color);
            if (colorObj != null) {
                element[index] = colorObj;
            }
        }
    }

    static getTrendUpArrow(now: number, prev: number): TrendArrow {
        if (now < 0 && prev < 0) {
            now = Math.abs(now);
            prev = Math.abs(prev);
        }
        if (now < prev) {
            return TrendArrow.UP_RIGHT;
        } else if (now > prev) {
            return TrendArrow.UP;
        } else {
            return TrendArrow.RIGHT;
        }
    }

    static getTrendArrow(value1: number, value2: number): TrendArrow {
        if (value1 < value2) {
            return TrendArrow.DOWN;
        } else if (value1 > value2) {
            return TrendArrow.UP;
        } else {
            return TrendArrow.RIGHT;
        }
    }

    static getIncidenceColor(incidence?: number): Color {
        if (!incidence) return Colors.GRAY;

        for (const value of Object.values(Incidence).sort((a, b) => {
            return b.limit - a.limit;
        })) {
            if (incidence >= value.limit) {
                return value.color;
            }
        }

        return Colors.GRAY;
    }

    static getTrendArrowColor(arrow: TrendArrow): Color {
        switch (arrow) {
            case TrendArrow.UP:
                return Incidence.RED.color;
            case TrendArrow.DOWN:
                return Incidence.GREEN.color;
            case TrendArrow.RIGHT:
                return Incidence.GRAY.color;
            default:
                return Colors.GRAY;
        }
    }

    static getAreaIcon(areaIBZ: number): string {
        const _type: AreaType | undefined = ENV.areaIBZ.get(areaIBZ)
        switch (_type) {
            case AreaType.KS:
                return 'KS';
            case AreaType.SK:
                return 'SK';
            case AreaType.SV_K:
            // fallthrough
            case AreaType.K:
                return 'K';
            case AreaType.SV_LK:
            // fallthrough
            case AreaType.LK:
                return 'LK';
            case AreaType.BZ:
                return 'BZ';
            case undefined:
                return 'BZ';
        }
    }

    static getStatusIconAndText(status?: DataStatus): [string, string] {
        let icon: string;
        let text: string;
        switch (status) {
            case DataStatus.OK:
                icon = '🆗';
                text = 'OK';
                break;
            case DataStatus.OFFLINE:
                icon = '⚡️';
                text = 'offline';
                break;
            case DataStatus.CACHED:
                icon = '💾';
                text = 'cached';
                break;
            case DataStatus.ERROR:
                icon = '❗'
                text = 'error'
                break;
            default:
                icon = '';
                text = '';
        }

        return [icon, text]
    }

    static getLocStatusIconAndText(status?: LocationStatus, type?: LocationType): [string, string] {
        let icon: string;
        let text: string;
        switch (status) {
            case LocationStatus.FAILED:
                icon = '⚡️';
                text = 'FAILED';
                break;
            case LocationStatus.OK:
                icon = type === LocationType.CURRENT ? '📍' : '';
                text = type === LocationType.CURRENT ? 'GPS' : '';
                break;
            case LocationStatus.CACHED:
                icon = type === LocationType.CURRENT ? '📡' : '';
                text = type === LocationType.CURRENT ? 'GPS?' : 'CACHED';
                break;
            default:
                icon = '';
                text = '';
        }
        return [icon, text];
    }

    static getLocTypeIconAndText(type: LocationType) {
        let icon: string;
        let text: string;
        switch (type) {
            case LocationType.STATIC:
                icon = '';
                text = '';
                break;
            case LocationType.CURRENT:
                icon = '📍';
                text = 'GPS';
                break;
            default:
                icon = '';
                text = '';
        }
        return [icon, text]
    }

    static elementDepth2BgColor(depth: number): Color {
        switch (depth) {
            case 0:
                return Colors.BACKGROUND;
            case 1:
                return Colors.BACKGROUND2;
            case 2:
                return Colors.BACKGROUND3;
            case 3:
                return Colors.BACKGROUND4;
            default:
                return Color.clear();
        }
    }
}

interface Savable {
    id: string;
    fm?: CustomFileManager;

    getStorageObject: () => Record<string, unknown>;
    save: () => Promise<void>;
}

interface DataInterface<S, T> {
    data: S;
    meta: T;
    getMaxFromDataObjectByIndex: (index: string) => number;
}

abstract class CustomData<S extends Record<string, unknown>, T extends Record<string, unknown>> implements DataInterface<S[], T>, Savable {
    id: string;
    meta: T;
    data: S[];
    fm?: CustomFileManager;

    protected constructor(id: string, data: S[], meta: T, fm: CustomFileManager = cfm) {
        this.id = id;
        this.meta = meta;
        this.data = data;
        this.fm = fm
    }

    static fromResponse(response) {
        throw new Error(`'fromResponse' must be implemented.`);
    }

    getMaxFromDataObjectByIndex(index: string): number {
        return CustomData.getMaxFromArrayOfObjectsByKey(this.data, index);
    }

    static getMaxFromArrayOfObjectsByKey(data: Record<string, unknown>[], index: string) {
        return Math.max(...data.map(value => typeof value[index] === "number" ? value[index] as number : 0));
    }

    abstract getStorageObject(): Record<string, unknown>;

    get storageFileName(): string {
        return `${(this.fm?.filestub ?? '') + this.id}.json`;
    }

    async save(): Promise<void> {
        this.fm?.write(this.getStorageObject(), this.storageFileName, FileType.JSON)
    }
}

class IncidenceData<T extends MetaData> extends CustomData<IncidenceValue, T> {
    location?: CustomLocation;

    constructor(id: string, data: IncidenceValue[], meta: T, location?: CustomLocation) {
        super(id, data, meta);
        this.location = location;
    }

    getDay(offset = 0): IncidenceValue | undefined {
        return this.data[this.data.length - 1 - offset];
    }

    getAvg(weekOffset = 0, ignoreToday = false): number {
        const caseData = this.data.reverse();
        const skipToday: number = ignoreToday ? 1 : 0;
        const offsetDays = 7;
        const weekData = caseData.slice(offsetDays * weekOffset + skipToday, offsetDays * weekOffset + 7 + skipToday);
        return weekData.reduce((acc, x) => acc + (x.incidence ?? 0), 0) / offsetDays;
    }

    getMaxCases(): number {
        return this.getMaxFromDataObjectByIndex('cases');
    }

    getMaxIncidence(): number {
        return this.getMaxFromDataObjectByIndex('incidence');
    }

    getMax(): IncGraphValues {

        return this.data.reduce((p: IncGraphValues, c: IncidenceValue) => {
            const {cases, incidence} = c;
            const {cases: pC, incidence: pI} = p;
            return {
                cases: !pC || (cases && cases > pC) ? cases : pC,
                incidence: !pI || (incidence && incidence > pI) ? incidence : pI
            }
        }, {});
    }

    getStorageObject(): { id: string, data: IncidenceValue[], meta: T } {
        return {id: this.id, data: this.data, meta: this.meta};
    }

    isArea(): this is IncidenceData<MetaArea> {
        return IncidenceData.isArea(this);
    }

    isState(): this is IncidenceData<MetaState> {
        return IncidenceData.isState(this);
    }

    isCountry(): this is IncidenceData<MetaCountry> {
        return IncidenceData.isCountry(this);
    }

    static fromResponse<T extends MetaData>(response: DataResponse<IncidenceData<T>>, location?: CustomLocation): IncidenceData<T> {
        const data = response.data;
        return new IncidenceData<T>(data.id, data.data, data.meta, location ?? data.location);
    }

    static fromObject<T extends MetaData>(data: Record<string, any>, location?: CustomLocation): IncidenceData<T>{
        return new IncidenceData<T>(data.id, data.data, data.meta, location ?? data.location)
    }

    static isIncidenceValue(value: Record<string, any>): value is IncidenceValue {
        return value.date !== undefined && value.date instanceof Date && !isNaN(value.date.getTime());
    }

    static isIncidenceValueArray(array: any[]): array is IncidenceValue[] {
        for (const arrayElement of array) {
            if (!IncidenceData.isIncidenceValue(arrayElement)) {
                return false;
            }
        }
        return true;
    }

    static async loadFromCache<T extends MetaData>(id: string, typeCheckMeta: (meta: any) => meta is T, ...params: any): Promise<DataResponse<IncidenceData<T>> | EmptyResponse> {
        const resp = await cfm.read(cfm.filestub + id, FileType.JSON_DICT);
        if (resp.status !== DataStatus.OK || resp.isEmpty()) {
            return resp as EmptyResponse;
        }

        const {id: idLoaded, data, meta} = resp.data;

        if (typeof idLoaded !== "string") {
            return DataResponse.error(`Id of stored data is not a string. (${typeof idLoaded})`);
        }

        if (id !== idLoaded) {
            return DataResponse.error(`Ids do not match. target: ${id}, loaded: ${idLoaded}`);
        }

        if (!Array.isArray(data)) {
            return DataResponse.error(`Stored Incidence data is not an array. (${typeof data})'`);
        }

        if (!IncidenceData.isStoredIncidenceValueArray(data)) {
            return DataResponse.error(`Stored Incidence data is not of type 'IncidenceDataStored[]'`);
        }

        if (!typeCheckMeta(meta)) {
            return DataResponse.error(`Stored meta data is of wrong type.`);
        }

        const incidenceData = new IncidenceData<T>(idLoaded, data.map(elem => {
            return {...elem, date: new Date(elem.date)}
        }), meta, ...params)

        return DataResponse.ok(incidenceData);
    }

    static async loadAreaFromCache(loc: CustomLocation): Promise<DataResponse<IncidenceData<MetaArea>> | EmptyResponse> {
        const respId = await CustomLocation.idFromCache(loc);
        if (respId.status !== DataStatus.OK || respId.isEmpty()) {
            return DataResponse.error('Obtaining id from cache failed.');
        }

        const id = respId.data;

        return await IncidenceData.loadFromCache<MetaArea>(id, IncidenceData.isMetaArea, loc);
    }

    static async loadStateFromCache(id: string): Promise<DataResponse<IncidenceData<MetaState>> | EmptyResponse> {
        return IncidenceData.loadFromCache<MetaState>(id, IncidenceData.isMetaState);
    }

    static async loadCountryFromCache(id: string): Promise<DataResponse<IncidenceData<MetaCountry>> | EmptyResponse> {
        return IncidenceData.loadFromCache<MetaCountry>(id, IncidenceData.isMetaCountry);
    }


    static completeHistory(data: IncidenceValue[], offset = CFG.def.maxShownDays + 7, last?: Date | number | string): IncidenceValue[] {
        if (!Array.isArray(data)) {
            throw Error('completeHistory: data is not an array');
        }

        data = data.sort((a, b) => a.date.getTime() - b.date.getTime());

        const lastDate = new Date(last ?? data[data.length - 1].date);
        //console.log(`completeHistory: lastDate: ${lastDate}`);
        const firstDate = new Date(new Date(lastDate).setDate(lastDate.getDate() - Math.abs(offset)));
        //console.log(`completeHistory: firstDate: ${firstDate}`);

        const completed: IncidenceValue[] = [];

        const currentDate = new Date(firstDate);
        let i = 0;

        while (currentDate <= lastDate) {
            if (i < data.length) {
                const value = data[i];
                if (currentDate.getDate() > new Date(value.date).getDate()) {
                    console.log(`completeHistory: skipp old value. date: ${currentDate} > value.date ${new Date(value.date)}`)
                    i++;
                    continue;
                }

                if (new Date(value.date).getDate() === currentDate.getDate()) {
                    //console.log(`completeHistory: use values from data. i: ${i}, date: ${currentDate}`)
                    completed.push({...value, date: new Date(currentDate)});
                    i++;
                    currentDate.setDate(currentDate.getDate() + 1);
                } else {
                    console.log(`completeHistory: fill missing value. i: ${i} date: ${currentDate}, value.date: ${new Date(value.date)}`);
                    completed.push({date: currentDate});
                    currentDate.setDate(currentDate.getDate() + 1);

                }
            } else {
                console.log(`completeHistory: fill missing value, no data left. i: ${i}, date: ${currentDate}`);
                completed.push({date: currentDate});
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        return completed;
    }

    static calcIncidence<T extends MetaData>(dataObject: IncidenceData<T>, disableLive: boolean = CFG.def.incidenceDisableLive): IncidenceData<T> {
        const reversedData = dataObject.data.reverse();
        for (let i = 0; i < CFG.def.maxShownDays; i++) {
            const theDays = reversedData.slice(i + 1, i + 1 + 7); // without today
            const sumCasesLast7Days = theDays.reduce((a, b) => a + (b.cases ?? 0), 0);
            reversedData[i].incidence = (sumCasesLast7Days / dataObject.meta.EWZ) * 100000;
        }

        const data = (dataObject as any)
        if (disableLive && data.meta.cases7_per_100k) {
            console.log('calcIncidence: using meta.cases7_per_100k');
            reversedData[0].incidence = data.meta.cases7_per_100k;
        } else {
            console.log('calcIncidence: using calculated incidence');
        }

        dataObject.data = reversedData.reverse();
        return dataObject;
    }

    static async loadVaccine(api: RkiService, name?: string): Promise<DataResponse<VaccineData> | EmptyResponse> {
        const cached = ENV.cacheVaccines.get(name ?? 'GER');
        if (cached !== undefined) {
            return new DataResponse(cached);
        }

        const data = await api.vaccineData();
        if (typeof data === 'boolean') {
            return DataResponse.error();
        }

        const vaccine: any = name ? data.states[name] : data;

        if (!vaccine) {
            return DataResponse.notFound(`Name not found in vaccine data. (${name})`)
        }

        if (!RkiService.isApiVaccineData(vaccine)) {
            return DataResponse.error('Obtained data is no Vaccine Data');
        }

        const vaccineData: VaccineData = {
            difference: vaccine.difference_to_the_previous_day,
            lastUpdated: data.lastUpdate,
            quote: vaccine.quote,
            second_vaccination: {
                difference: vaccine["2nd_vaccination"].difference_to_the_previous_day,
                vaccinated: vaccine["2nd_vaccination"].vaccinated,
                quote: vaccine["2nd_vaccination"].quote,
            },
            vaccinated: vaccine.vaccinated,
            vaccinations_per_1k: vaccine.vaccinations_per_1000_inhabitants,
        }

        ENV.cacheVaccines.set(name ?? 'GER', vaccineData);

        return new DataResponse(vaccineData);
    }

    static async loadCountry(api: RkiService, code: string, loadVaccine = false, cacheMaxAge: number = CFG.def.cacheMaxAge): Promise<DataResponse<IncidenceData<MetaCountry>> | EmptyResponse> {
        const cached = ENV.cacheCountries.get(code);
        if (cached !== undefined) {
            return new DataResponse(cached);
        }
        const logPre = `country ${code}`;

        // GER DATA
        const {cachedData, cachedAge} = await IncidenceData.loadCached(code, IncidenceData.loadCountryFromCache);

        if (cachedData && cachedAge && cachedAge < cacheMaxAge * 3600) {
            console.log(`${logPre}: using cached data`);
            return DataResponse.ok(cachedData);
        } else {
            console.log(`${logPre}: cache lifetime exceeded`)
        }

        const cases = await api.casesGer();
        if (typeof cases === 'boolean') {
            return DataResponse.error();
        }

        let vaccine: VaccineData | undefined;
        if (loadVaccine) {
            const resVac = await IncidenceData.loadVaccine(api);
            if (!resVac.succeeded() || resVac.isEmpty()) {
                console.warn('Loading vaccine data failed');
                vaccine = undefined;
            } else {
                vaccine = resVac.data;
            }
        }

        const meta: MetaCountry = {
            name: 'Deutschland',
            short: 'GER',
            r: await api.rData(),
            EWZ: 83_166_711,
            vaccine: vaccine
        };
        const data = new IncidenceData<MetaCountry>(code, cases, meta);
        await data.save()
        ENV.cacheCountries.set(code, data);
        return new DataResponse(data);
    }

    static async loadArea(api: RkiService, loc: CustomLocation, cacheMaxAge: number = CFG.def.cacheMaxAge): Promise<| DataResponse<IncidenceData<MetaArea>> | EmptyResponse> {
        const location = await CustomLocation.getLocation(loc);

        if (location.status === LocationStatus.FAILED) {
            console.log(`Getting location failed (${loc.latitude},${loc.longitude}). Trying to load from cache...`);

            const resp = await IncidenceData.loadAreaFromCache(location);
            if (resp.succeeded() && !resp.isEmpty()) {
                return DataResponse.cached(resp.data);
            } else {
                return DataResponse.error('Loading from cache failed.');
            }
        }

        // load data from cache. If its fresh enough we return it
        const {cachedData, cachedAge} = await IncidenceData.loadCached(location, IncidenceData.loadAreaFromCache);

        if (cachedData && cachedAge && cachedAge < cacheMaxAge * 1000) {
            console.log('Using cached data')
            return DataResponse.ok(cachedData);
        } else {
            console.log('Cache lifetime exceeded, trying to update data...');
        }


        // get information for area
        const info = await api.locationData(location);
        if (!info) {
            const msg = `Getting meta data failed (${loc.latitude} ${loc.longitude})`;
            if (cachedData) {
                console.log(`${msg}, using cached data`);
                return DataResponse.cached(cachedData);
            } else {
                return DataResponse.error(msg);
            }
        }

        const id = info.RS;
        // get cases for area
        const cases = await api.casesArea(id);
        if (typeof cases === 'boolean') {
            const msg = `Getting cases failed (${id})`;
            if (cachedData) {
                console.log(`${msg}, trying to use cached data`);
                return DataResponse.cached(cachedData);
            } else {
                return DataResponse.error(msg);
            }
        }

        const meta: MetaArea = {
            BL: info.BL,
            BL_ID: info.BL_ID,
            EWZ: info.EWZ,
            EWZ_BL: info.EWZ_BL,
            IBZ: info.IBZ,
            RS: info.RS,
            cases: info.cases,
            cases7_bl_per_100k: info.cases7_bl_per_100k,
            cases7_per_100k: info.cases7_per_100k,
            cases_per_100k: info.cases_per_100k,
            last_update: info.last_update,
            name: info.GEN,
        }

        await CustomLocation.geoCache(location, id);

        const data = new IncidenceData<MetaArea>(id, cases, meta, location);
        await data.save();

        return new DataResponse(data);
    }


    static async loadState(api: RkiService, id: string, name: string, ewz: number, loadVaccine = false, cacheMaxAge: number = CFG.def.cacheMaxAge): Promise<DataResponse<IncidenceData<MetaState>> | EmptyResponse> {
        const applicationCached = ENV.cacheStates.get(id);
        if (typeof applicationCached !== 'undefined') {
            return new DataResponse(applicationCached);
        }

        const logPre = `state ${id}`;

        const {cachedData, cachedAge} = await this.loadCached(id, IncidenceData.loadStateFromCache);

        if (cachedData && cachedAge && cachedAge < cacheMaxAge * 1000) {
            console.log(`${logPre}: using cached data`)
            return new DataResponse(cachedData);
        } else {
            console.log(`${logPre}: cache lifetime exceeded, trying to update data...`);
        }

        const cases = await api.casesState(id);
        if (typeof cases === 'boolean') {
            const msg = `${logPre}: Getting state failed`;
            console.log(`${msg}, using cached data`);
            if (cachedData) {
                return DataResponse.cached(cachedData);
            } else {
                return DataResponse.error(msg);
            }
        }

        name = ENV.states.get(id)?.name ?? name;

        let vaccine: VaccineData | undefined = undefined;
        if (loadVaccine) {
            const respVac = await IncidenceData.loadVaccine(api, name);
            if (respVac.succeeded() && !respVac.isEmpty()) {
                vaccine = respVac.data;
            } else {
                console.warn(`${logPre}: loading vaccine data failed.`)
            }
        }


        const short = ENV.states.get(id)?.short ?? id;
        const meta: MetaState = {
            BL_ID: id,
            BL: name,
            EWZ: ewz,
            name: name,
            short: short,
            vaccine: vaccine,
        };
        const data = new IncidenceData<MetaState>(id, cases, meta);
        await data.save()

        ENV.cacheStates.set(id, data);
        return new DataResponse(data);
    }

    private static async loadCached<P extends string | CustomLocation, T extends IncidenceData<MetaArea | MetaState | MetaCountry>>(param: P, fn: (p: P) => Promise<DataResponse<T> | EmptyResponse>): Promise<{ cachedData?: T; cachedAge?: number }> {
        const cached = await fn(param);

        let cachedData: T | undefined;
        let cachedAge: number | undefined;
        if (!cached.isEmpty() && cached.status === DataStatus.OK) {
            cachedData = cached.data;
            const lastModified = cfm.modificationDate(cachedData.storageFileName);
            cachedAge = Date.now() - (lastModified ?? new Date()).getTime();
        } else {
            console.warn(`Loading from cache failed. empty: ${cached.isEmpty()}, status: ${cached.status}, msg: ${cached.msg}`);
        }
        return {cachedData, cachedAge};
    }

    static isState(data: IncidenceData<MetaData>): data is IncidenceData<MetaState> {
        return IncidenceData.isMetaState(data.meta)
    }

    static isCountry(data: IncidenceData<MetaData>): data is IncidenceData<MetaCountry> {
        return IncidenceData.isMetaCountry(data.meta);
    }

    static isArea(data: IncidenceData<MetaData>): data is IncidenceData<MetaArea> {
        return IncidenceData.isMetaArea(data.meta);
    }

    static isMetaState(meta: any): meta is MetaState {
        const keys = ['BL_ID', 'BL', 'EWZ']
        return Helper.keysAreDefined(meta, keys, 'MetaState')
    }

    static isMetaCountry(meta: any): meta is MetaCountry {
        const keys = ['r', 'EWZ']
        return Helper.keysAreDefined(meta, keys, 'MetaCountry')

    }

    static isMetaArea(meta: any): meta is MetaArea {
        const keys = ['name', 'RS', 'IBZ', 'cases', 'cases_per_100k', 'EWZ', 'last_update', 'BL', 'BL_ID', 'EWZ_BL', 'cases7_bl_per_100k'];
        return Helper.keysAreDefined(meta, keys, 'MetaArea');
    }

    static isStoredIncidenceValue(value: any): value is IncidenceValueStored {
        const {date, cases, incidence} = value;

        for (const x of [cases, incidence]) {
            if (x !== undefined && isNaN(x)) {
                return false;
            }
        }
        return !isNaN(new Date(date).getTime());
    }

    static isStoredIncidenceValueArray(array: any[]): array is IncidenceValueStored[] {
        for (let i = 0; i < array.length; i++){
            const arrayElement = array[i];
            if(!IncidenceData.isStoredIncidenceValue(arrayElement)){
                console.warn(`Element at ${i} not of type 'StoredIncidenceValue'.`);
                return false;
            }
        }
        return true;
    }

}

class MultiAreaRow {
    private readonly state: IncidenceData<MetaState>;
    private currentLocation?: areaDataRow;
    private currentId: string;
    private readonly areas: Map<string, areaDataRow>;

    constructor(state: IncidenceData<MetaState>, areaRows: areaDataRow[] = []) {
        this.state = state;
        this.areas = new Map();

        for (const row of areaRows) {
            this.addAreaRow(row);
        }
    }

    get length(): number {
        return (this.currentLocation ? 1 : 0) + this.areas.size + 1;
    }

    isCurrentLocation(): boolean {
        return this.currentLocation !== undefined;
    }

    addAreaRow(areaRow: areaDataRow): void {
        const data = areaRow.data;
        if (!data) {
            console.log('AreaRow has no data');
            return;
        }

        const blId = data.meta.BL_ID;
        if (blId !== this.state.meta.BL_ID) {
            console.warn(`BL_ID of area and state do not match. (${blId}, should be ${this.state.meta.BL_ID})`);
            return;
        }
        const {id: areaId} = data;
        if (this.areas.has(areaId) || this.currentId === areaId) {
            console.log('Area has already been added. To update an area use updateAreaRow.');
            return;
        }

        const location = data.location;
        if (location?.type === LocationType.CURRENT) {
            this.currentLocation = areaRow;
            this.currentId = areaId;
        } else {
            this.areas.set(areaId, areaRow);
        }
    }

    getAreaRows(): areaDataRow[] {
        return this.currentLocation ? [this.currentLocation, ...this.areas.values()] : Array.from(this.areas.values());
    }

    getState(): IncidenceData<MetaState> {
        return this.state;
    }
}

class MultiAreaRows {
    private mapStates: Map<string, MultiAreaRow>;
    private currentLocation?: MultiAreaRow;
    private currentId?: string;
    private readonly max: number;

    constructor(max: number) {
        this.mapStates = new Map();
        this.max = max;
    }


    get length(): number {
        return (this.currentLocation?.length ?? 0) + Array.from(this.mapStates.values()).reduce((p, c) => p + c.length, 0);
    }

    addState(state: IncidenceData<MetaState>): void {
        const stateId = state.meta.BL_ID;
        if (this.mapStates.has(stateId)) {
            console.log(`State with id ${stateId} has already been added.`);
        } else {
            this.mapStates.set(stateId, new MultiAreaRow(state));
        }
    }

    addAreaRow(areaRow: areaDataRow): void {
        if (this.length >= this.max) {
            console.log('Reached maximum size. Area not added.');
            return;
        }
        const blId = areaRow.data?.meta.BL_ID;
        if (!blId) {
            console.log('areaRow has no data.');
            return;
        }

        if (blId === this.currentId && this.currentLocation) {
            this.currentLocation.addAreaRow(areaRow);
            return;
        }

        const state = this.mapStates.get(blId);
        if (!state) {
            console.warn(`No state with the id ${blId} has been added. Make sure to add the state before adding the area.`);
            return;
        }

        state.addAreaRow(areaRow);
        if (state.isCurrentLocation()) {
            this.currentLocation = state;
            this.currentId = blId;
            this.mapStates.delete(blId);
        }

    }

    getMultiRows(): { areaRows: areaDataRow[], state: IncidenceData<MetaState> }[] {
        const values: MultiAreaRow[] = this.currentLocation ? [this.currentLocation, ...this.mapStates.values()] : [...this.mapStates.values()];

        return values.map(value => {
            return {areaRows: value.getAreaRows(), state: value.getState()};
        });

    }

}

enum LocationStatus {
    OK = 'loc_ok',
    CACHED = 'loc_cached',
    FAILED = 'loc_failed',
}

enum LocationType {
    CURRENT = 'loc_current',
    STATIC = 'loc_static',
}

interface CustomLocationInterface {
    latitude: number;
    longitude: number;
    type: LocationType;
    name?: string;
    status?: LocationStatus;
}

class CustomLocation implements CustomLocationInterface {
    latitude: number;
    longitude: number;
    type: LocationType;
    name?: string;
    status?: LocationStatus;

    static async current(): Promise<CustomLocation | null> {
        try {
            Location.setAccuracyToThreeKilometers();
            const _coords = await Location.current();
            _coords.status = LocationStatus.OK;
            return _coords;
        } catch (e) {
            console.warn(e);
            return null
        }
    }

    static async getLocation({latitude, longitude, name, type}: CustomLocation): Promise<CustomLocation> {
        if (latitude >= 0 && longitude >= 0) {
            return {latitude, longitude, name, type, status: LocationStatus.OK};
        }
        let _loc = await CustomLocation.current();
        if (_loc === null) {
            _loc = await CustomLocation.currentFromCache();
            if (_loc === null) {
                return {latitude, longitude, name, type, status: LocationStatus.FAILED};
            }
        }
        _loc.name = name;
        _loc.type = type;
        return _loc;
    }

    static fromWidgetParameters(str: string): CustomLocation[] {
        const _staticCoords = str.split(';').map(coords => coords.split(','));

        const _current = () => {
            return {latitude: -1, longitude: -1, type: LocationType.CURRENT, name: undefined};
        };

        const _coords: { index: number, location: CustomLocation }[] = [];
        for (const coords of _staticCoords) {
            if (coords.length === 0) {
                console.warn('To few arguments, expected at least one.');
                continue;
            } else if (coords.length > 4) {
                console.warn(`To many arguments for a location (expected up to 4): '${coords.join(',')}'`)
            }

            const index = parseInt(coords[0]);
            let latitude: number;
            let longitude: number;
            let name: string | undefined;
            let type: LocationType;
            if (coords.length <= 2) {
                latitude = -1;
                longitude = -1;
                name = coords[1] ?? undefined;
                type = LocationType.CURRENT;
            } else {
                latitude = parseFloat(coords[1] ?? '-1');
                longitude = parseFloat(coords[2] ?? '-1');
                name = coords[3] ?? undefined;
                type = LocationType.STATIC;
            }

            _coords[index] = {index, location: {latitude, longitude, type, name}};
        }
        if (_coords.length === 0) {
            return [_current()];
        }

        const _locations: CustomLocation[] = []
        for (let i = 0; i < _coords[_coords.length - 1].index + 1; i++) {
            const coord = _coords[i];
            if (coord !== undefined) {
                for (let j = i; j < coord.index; j++) {
                    _locations.push(_current());
                    console.log('Filled missing location.')
                }
                _locations.push(coord.location)

            } else {
                _locations.push(_current());
                console.log('Filled empty location.')
            }
        }

        return _locations;
    }

    static async geoCache({latitude, longitude, type}: CustomLocation, id: string): Promise<void> {
        const lat = latitude.toFixed(CFG.geoCacheAccuracy);
        const lon = longitude.toFixed(CFG.geoCacheAccuracy);
        const key: string = lat + ',' + lon;

        const resp = await cfm.read(`${cfm.filestub}_geo`, FileType.JSON_DICT);
        let data: Record<string, unknown>;
        if (resp.status === DataStatus.NOT_FOUND) {
            console.log('GeoCache does not exist. File will be created...');
            data = {};
        } else if (!resp.isEmpty() && resp.status === DataStatus.OK) {
            data = resp.data;
        } else {
            return;
        }

        const current = data[key];
        if (current !== undefined && current !== id) {
            console.warn(`Cached value for '${key}' at accuracy ${CFG.geoCacheAccuracy} differs from new value. (${current} !== ${id})`);
        }

        if (type === LocationType.CURRENT) data['gps'] = key;
        data[key] = id;

        await cfm.write(data, `${cfm.filestub}_geo`, FileType.JSON);
    }

    static async idFromCache({
                                 latitude,
                                 longitude,
                                 type
                             }: CustomLocation): Promise<DataResponse<string> | EmptyResponse> {

        const resp = await cfm.read(`${cfm.filestub}_geo`, FileType.JSON_DICT);
        if (resp.status !== DataStatus.OK || resp.isEmpty()) {
            console.log('Error loading geoCache file.');
            return DataResponse.error();
        }
        const data: Record<string, unknown> = resp.data;

        let _key: unknown;
        if (type === LocationType.CURRENT) {
            _key = data['gps'];
            if (_key === undefined) {
                console.log('No key for current location.');
                return DataResponse.notFound();
            }
        } else {
            const _lat = latitude.toFixed(CFG.geoCacheAccuracy);
            const _lon = longitude.toFixed(CFG.geoCacheAccuracy);
            _key = _lat + ',' + _lon;
        }

        if (typeof _key !== 'string') {
            console.warn(`idFromCache: Invalid key '${_key}'. Must be of type string.`);
            return DataResponse.error();
        }
        const id = data[_key];
        if (id === undefined || typeof id !== 'string') {
            console.log(`No value for '${_key}' at accuracy ${CFG.geoCacheAccuracy}.`);
            return DataResponse.notFound();
        }

        return new DataResponse(id);
    }

    static async currentFromCache(): Promise<CustomLocation | null> {
        const resp = await cfm.read('/coronaWidget_geo', FileType.JSON_DICT);
        if (resp.status !== DataStatus.OK || resp.isEmpty()) {
            console.log('Error loading geoCache file.');
            return null;
        }
        const data: Record<string, unknown> = resp.data;

        const locStr = data['gps'];
        if (!locStr) {
            console.log('currentFromCache: Current location not cached.');
            return null;
        }
        if (typeof locStr !== 'string') {
            console.warn(`currentFromCache: Invalid value '${locStr}' for current location`);
            return null;
        }
        const parts = locStr.split(',');
        if (parts.length !== 2) {
            console.log(`currentFromCache: Invalid value cached for current location. (${locStr})`);
            return null;
        }
        const latitude = Number.parseFloat(parts[0]);
        const longitude = Number.parseFloat(parts[1]);

        return {latitude, longitude, type: LocationType.CURRENT, status: LocationStatus.CACHED};
    }
}

interface DataResponseInterface<T> {
    data: T;
    status: DataStatus;
    succeeded: () => boolean;
    msg?: string;
}

class DataResponse<T> implements DataResponseInterface<T> {
    data: T;
    status: DataStatus;
    msg?: string;

    constructor(data: T, status: DataStatus = DataStatus.OK, msg?: string) {
        this.data = data;
        this.status = status;
        if (msg) this.msg = msg;
    }

    succeeded(): boolean {
        return DataResponse.isSuccess(this.status);
    }

    /**
     * Checks if the `DataResponse` is Empty.
     * If the field `data` is `null` or `undefined` the object is an instance of `EmptyResponse`.
     * Otherwise its an instance of `DataResponse`
     */
    isEmpty(): this is DataResponse<null> {
        return DataResponse.isEmpty(this);
    }

    static fromDataResponse<T>(resp: DataResponse<T>, status: DataStatus): DataResponse<T> {
        return new DataResponse<T>(resp.data, status, resp.msg)
    }

    public static empty(status = DataStatus.OK, msg?: string): EmptyResponse {
        if (msg) console.warn(msg);
        return new DataResponse<null>(null, status, msg)
    }

    static isSuccess(status: DataStatus): boolean {
        return status === DataStatus.OK || status === DataStatus.CACHED;
    }

    static ok<T>(data: T, msg?: string) {
        return new DataResponse<T>(data, DataStatus.OK, msg);
    }

    static error(msg?: string): EmptyResponse {
        return DataResponse.empty(DataStatus.ERROR, msg);
    }

    static apiError(msg?: string): EmptyResponse {
        return DataResponse.empty(DataStatus.API_ERROR, msg)
    }

    static notFound(msg?: string): EmptyResponse {
        return DataResponse.empty(DataStatus.NOT_FOUND, msg);
    }

    static cached<T>(data: T): DataResponse<T> {
        if (data instanceof DataResponse) {
            return DataResponse.fromDataResponse(data, DataStatus.CACHED);
        }
        return new DataResponse<T>(data, DataStatus.CACHED);
    }

    /**
     * Checks if the `DataResponse` is Empty.
     * If the field `data` is `null` or `undefined` the object is an instance of `EmptyResponse`.
     * Otherwise its an instance of `DataResponse`
     */
    static isEmpty<T>(resp: DataResponse<T> | EmptyResponse): resp is EmptyResponse {
        return resp.data == null
    }

}

type EmptyResponse = DataResponse<null>

enum FileType {
    TEXT = 'txt',
    JSON = 'json',
    JSON_DICT = 'json_dict',
    OTHER = '',
    LOG = 'log',
}

const FileExtensions: Record<FileType, string> = {
    [FileType.TEXT]: 'txt',
    [FileType.JSON]: 'json',
    [FileType.JSON_DICT]: 'json',
    [FileType.LOG]: 'log',
    [FileType.OTHER]: '',
}

interface FileManagerInterface<D> {
    fm: FileManager;
    configDir: string;
    configPath: string;
    copy: (from: string, to: string) => void;
    write: (data: D, file: string, type: FileType) => void;
    read: (file: string, type: FileType) => Promise<DataResponse<D> | EmptyResponse>;
}

class CustomFileManager implements FileManagerInterface<Record<string, unknown> | string> {
    configDir: string;
    configPath: string;
    scriptableDir: string;
    filestub: string;
    fm: FileManager;

    constructor(configDir: string, filestub: string) {
        try {
            this.fm = FileManager.iCloud();
            this.fm.documentsDirectory();
        } catch (e) {
            console.warn(e);
            this.fm = FileManager.local();
        }
        this.configDir = configDir;
        this.scriptableDir = this.fm.documentsDirectory();
        this.configPath = this.fm.joinPath(this.fm.documentsDirectory(), this.configDir);
        this.filestub = filestub;

        if (!this.fm.isDirectory(this.configPath)) this.fm.createDirectory(this.configPath);
    }

    private getAbsolutePath(relFilePath: string, configDir = true): string {
        return this.fm.joinPath(configDir ? this.configPath : this.scriptableDir, relFilePath);
    }

    fileExists(filePath: string, configDir = true): boolean {
        return this.fm.fileExists(this.getAbsolutePath(filePath, configDir));
    }

    copy(from: string, to: string, configDir = true): void {
        const pathFrom = this.getAbsolutePath(from, configDir);
        const pathTo = this.getAbsolutePath(to, configDir);
        this.fm.copy(pathFrom, pathTo);
    }

    async read(file: string): Promise<DataResponse<string> | EmptyResponse>
    async read(file: string, type: FileType.JSON, configDir?: boolean): Promise<DataResponse<Record<string, unknown> | Array<unknown> | number | string | null> | EmptyResponse>
    async read(file: string, type: FileType.JSON_DICT, configDir?: boolean): Promise<DataResponse<Record<string, unknown>> | EmptyResponse>
    async read(file: string, type: FileType.TEXT, configDir?: boolean): Promise<DataResponse<string> | EmptyResponse>
    async read(file: string, type: FileType = FileType.TEXT, configDir = true): Promise<DataResponse<Record<string, unknown> | Array<unknown> | number | string | null> | EmptyResponse> {
        const ext = CustomFileManager.extensionByType(type);
        const path = this.getAbsolutePath(file.endsWith(ext) ? file : file + ext, configDir);

        if (this.fm.isFileStoredIniCloud(path) && !this.fm.isFileDownloaded(path)) {
            await this.fm.downloadFileFromiCloud(path);
        }

        if (this.fm.fileExists(path)) {
            try {
                const resStr = this.fm.readString(path);

                if (type === FileType.JSON) {
                    return new DataResponse<Record<string, string>>(JSON.parse(resStr));
                } else if (type === FileType.JSON_DICT) {
                    const dict = JSON.parse(resStr);
                    if (typeof dict !== 'object' || Array.isArray(dict) || dict === null) {
                        console.warn('read: parsed data not a dictionary.')
                        return DataResponse.error();
                    } else {
                        return new DataResponse<Record<string, unknown>>(dict);
                    }
                } else {
                    return new DataResponse<string>(resStr);
                }
            } catch (e) {
                console.error(e);
                return DataResponse.error();
            }
        } else {
            console.warn(`File ${path} does not exist.`);
            return DataResponse.notFound();
        }
    }

    write(data: Record<string, unknown> | string, file: string = this.filestub, type: FileType = FileType.TEXT, configDir = true): void {
        let dataStr;
        if (type === FileType.JSON || type === FileType.JSON_DICT) {
            dataStr = JSON.stringify(data);
        } else if (type === FileType.TEXT) {
            dataStr = data;
        } else {
            dataStr = data
        }
        const ext = CustomFileManager.extensionByType(type);
        const path = this.getAbsolutePath(file.endsWith(ext) ? file : file + ext, configDir);
        this.fm.writeString(path, dataStr);
    }

    remove(filePath: string, baseDir = true): void {
        this.fm.remove(this.getAbsolutePath(filePath, baseDir));
    }

    modificationDate(filePath: string, baseDir = true): Date | null {
        return this.fm.modificationDate(this.getAbsolutePath(filePath, baseDir))
    }

    listContents(filePath: string, configDir = true): string[] {
        return this.fm.listContents(this.getAbsolutePath(filePath, configDir));
    }

    static extensionByType(type: FileType, omitDot = false): string {
        const dot = omitDot ? '' : '.'
        switch (type) {
            case FileType.TEXT:
                return dot + 'txt';
            case FileType.JSON_DICT:
            case FileType.JSON:
                return dot + 'json';
            case FileType.LOG:
                return dot + 'log';
            default:
                return '';
        }
    }

    static typeByExtension(extension: string): FileType {
        switch (extension) {
            case 'txt':
                return FileType.TEXT;
            case 'json':
                return FileType.JSON;
            case 'log':
                return FileType.LOG
            default:
                throw new Error(`Unknown extension ${extension}.`);
        }
    }

}

class Format {
    static dateStr(timestamp: string | number | Date, time = false): string {
        const _date = new Date(timestamp);
        let str = `${_date.getDate().toString().padStart(2, '0')}` +
            `.${(_date.getMonth() + 1).toString().padStart(2, '0')}` +
            `.${_date.getFullYear()}`
        if (time) {
            str += ' ' + Format.timeStr(_date)
        }
        return str;
    }

    static timeStr(timestamp: string | number | Date): string {
        const _date = new Date(timestamp);
        const _hours = _date.getHours().toString()
        const _minutes = _date.getMinutes().toString()
        return `${_hours.padStart(2, '0')}:${_minutes.padStart(2, '0')}`

    }

    static number(number: number, fractionDigits = 0, limit?: number): string {
        if (limit && number >= limit) fractionDigits = 0;
        return Number(number).toLocaleString(undefined, {
            maximumFractionDigits: fractionDigits,
            minimumFractionDigits: fractionDigits,
        });
    }

    static rValue(data: string): Rdata {
        const parsedData = Parse.rCSV(data, ',');
        const res: Rdata = {date: null, r: 0};
        if (parsedData.length === 0) return res;
        // find used key
        let rValueField;
        Object.keys(parsedData[0]).forEach(key => {
            CSV_RVALUE_FIELDS.forEach(possibleRKey => {
                if (key === possibleRKey) {
                    console.log(`rValue: match on key ${key}`);
                    rValueField = possibleRKey;
                }
            });
        });
        const firstDateField = Object.keys(parsedData[0])[0];
        if (rValueField) {
            parsedData.forEach(item => {
                const date = item[firstDateField];
                const value = item[rValueField];
                if (typeof date !== 'undefined' && date.includes('-') &&
                    typeof value !== 'undefined' &&
                    parseFloat(value.replace(',', '.')) > 0) {
                    res.r = parseFloat(item[rValueField].replace(',', '.'));
                    res.date = item['Datum'];
                }
            });
        }
        return res;
    }
}

class Parse {
    static rCSV(rDataStr: string, separator = ',') {
        const lines = rDataStr.split(/(?:\r\n|\n)+/).filter(el => el.length !== 0);
        const headers = lines[0].split(separator);
        const elements: { [key: string]: any }[] = [];
        for (let i = 1; i < lines.length; i++) {
            let element = {};
            const values = lines[i].split(separator);
            element = values.reduce(function (result, field, index) {
                result[headers[index]] = field;
                return result;
            }, {});
            elements.push(element);
        }
        return elements;
    }

    /**
     * Parses `Color` from hex string. (ex. '#01fg74')
     * Supports short version (ex.: '#000') and alpha values as 4th element (ex.: '#0000' or '#FFFFFF0F').
     * (Short hex will be converted to long hex by doubling all numbers)
     * If the given string is no valid hex for a color, null will be returned.
     * @param {string} color
     */
    static color(color: string): Color | null {
        let hex: string, alpha: number;
        if (/^#[\da-f]{3,4}$/i.test(color)) {
            hex = Array.from(color.slice(1, 4)).reduce((acc, b) => {
                return acc + b + b;
            }, '#');
            const char = color.charAt(4);
            alpha = char.length === 1 ? parseInt(char + char, 16) / 255 : 1
        } else if (/^#(?:[\da-f]{2}){3,4}$/i.test(color)) {
            hex = color.slice(0, 7);
            const str = color.slice(7, 9)
            alpha = str.length === 2 ? parseInt(str, 16) / 255 : 1
        } else {
            console.warn(`'${color}' is not a valid colorString.'`);
            return null;
        }

        return new Color(hex, alpha)
    }
}

class Helper {
    static getDateBefore(offset: number, startDate: Date = new Date()): string | undefined {
        const offsetDate = new Date();
        offsetDate.setDate(startDate.getDate() - offset);
        return offsetDate.toISOString().split('T').shift();
    }

    static keysAreDefined(object: any, keys: string[], name?: string, log = true): boolean {
        for (const key of keys) {
            if (object[key] === undefined) {
                if (log) console.warn(`Object is not of type '${name}'. Key '${key}' is missing.`)
                return false;
            }
        }

        return true;
    }

    static aggregateToMultiRows(areaRows: areaDataRow[], states: IncidenceData<MetaState>[], maxLength = 0): { areaRows: areaDataRow[]; state: IncidenceData<MetaState> }[] {
        const multiRows = new MultiAreaRows(maxLength);

        for (const state of states) {
            multiRows.addState(state);
        }

        for (const areaRow of areaRows) {
            multiRows.addAreaRow(areaRow);
        }

        return multiRows.getMultiRows();
    }

    static mergeConfig(target: Config, source: { [k: string]: { [k: string]: any } }, skipKeys: string[] = []): void {
        for (const key in source) {
            if (skipKeys.includes(key)) {
                console.log('skipping key ' + key);
                continue;
            }

            if (typeof target[key] === "object") {
                if (key in target) {
                    target[key] = {...target[key], ...source[key]};
                } else {
                    target[key] = source[key];
                }
            } else {
                target[key] = source[key];
            }
        }
    }

    static async migrateConfig(path = 'config.json', target?: string): Promise<void> {
        function helper<T>(src: Record<string, any> | undefined, target: T, keys: ([string, string] | [string])[]): T {
            if (!src) return target;
            for (const k of keys) {
                if (src[k[0]] !== undefined) {
                    target[k[1] ?? k[0]] = src[k[0]];
                }
            }
            return target;
        }

        if (!cfm.fileExists(path)) {
            return;
        }
        const resp = await cfm.read(path, FileType.JSON_DICT);
        if (!(resp.status === DataStatus.OK && !resp.isEmpty())) {
            console.log('config already migrated');
            return;
        }
        const old = resp.data as Record<string, any>;
        let migrated: ConfigOpt = {
            version: '1.2.0',
            def: {}
        };
        if (old.version && old.version === migrated.version) {
            console.log('config already migrated');
            return;
        }

        migrated = helper(old.script, migrated, [['autoUpdate'], ['autoUpdateInterval']]);
        migrated = helper(old.api, migrated, [['csvRvalueField']]);
        migrated = helper(old.geoCache, migrated, [['accuracy', 'geoCacheAccuracy']]);
        migrated.def = helper(old.graph, migrated.def, [['maxShownDays'], ['upsideDown', 'graphUpsideDown'], ['showIndex', 'graphShowIndex']]);
        migrated.def = helper(old.cache, migrated.def, [['maxAge', 'cacheMaxAge']]);
        migrated.def = helper(old.widget, migrated.def, [['refreshInterval'], ['openUrlOnTap'], ['openUrl'], ['alternatelarge']]);
        migrated.def = helper(old.state, migrated.def, [['useShortName', 'stateUseShorName']]);
        migrated.def = helper(old.incidence, migrated.def, [['disableLive', 'incidenceDisableLive']]);
        migrated.def = helper(old.vaccine, migrated.def, [['show', 'showVaccine']]);

        cfm.write(migrated, target ?? path, FileType.JSON);
    }

    static async loadConfig(path = 'config.json', path_default = '.default.json') {
        if (!cfm.fileExists(path_default)) {
            console.warn('default config not found');
        } else {
            const resp = await cfm.read(path_default, FileType.JSON_DICT);
            if (resp.status === DataStatus.OK && !resp.isEmpty()) {
                // Todo check format of loaded config
                const cfg_default = resp.data as Record<string, Record<string, any>>;
                Helper.mergeConfig(CFG, cfg_default);
            } else {
                console.warn('error reading defaults');
            }
        }

        if (!cfm.fileExists(path)) {
            console.log('no user config found');
        } else {
            const resp = await cfm.read(path, FileType.JSON);
            if (resp.status === DataStatus.OK && !resp.isEmpty()) {
                // Todo check format of loaded config
                console.log('Config loaded successfully.');
                const cfg = resp.data as Record<string, Record<string, any>>;
                Helper.mergeConfig(CFG, cfg);
            } else {
                console.warn('error reading config');
            }
        }
    }

    static async getLatestConfig(): Promise<any | false> {
        const req = new Request(HTTP_CONFIG);
        req.timeoutInterval = 10;

        let data;
        try {
            data = await req.loadString();
        } catch (e) {
            console.log('getLatestConfig: request failed')
            console.warn(e);
            return false;
        }

        const response = req.response;

        if (response.statusCode !== 200) {
            console.warn('getLatestConfig: failed: ' + response.statusCode);
            return false;
        }

        console.log('getLatestConfig: received config from repository');
        return JSON.parse(data);
    }

    static async updateScript() {
        const currentDate = new Date();
        const {autoUpdateInterval, autoUpdate} = CFG;

        if (!autoUpdate) {
            console.log('updateScript: skip (disabled)')
            return;
        }
        console.log('updateScript: start updated');

        let _data: Record<string, any> = {};
        if (cfm.fileExists('.data.json', true)) {
            const res = await cfm.read('.data', FileType.JSON, true);

            if (res.status === DataStatus.OK && !res.isEmpty()) {
                if (typeof res.data !== 'object' || Array.isArray(res.data) || res.data === null) {
                    console.warn('updateScript: _data is not a dictionary');
                    _data = {}
                } else {
                    _data = res.data;
                }
            } else {
                _data = {};
            }
        }

        const lastUpdate = new Date(_data['lastUpdated'] ?? 0);
        const nextUpdate = new Date(lastUpdate);
        nextUpdate.setDate(nextUpdate.getDate() + autoUpdateInterval);
        if (nextUpdate > currentDate) {
            console.log(`updateScript: skip (last update less than ${autoUpdateInterval} day${autoUpdateInterval !== 1 ? 's' : ''} ago)`);
            return;
        }

        const lastCheck = new Date(_data['lastCheck'] ?? 0);
        const nextCheck = new Date(lastCheck);
        nextCheck.setDate(nextCheck.getDate() + 1); // if the last update is older than the autoUpdateInterval we check daily for updates based on the version
        if (nextCheck > currentDate) {
            console.log('updateScript: skip (last check less than 1 day ago)');
            return;
        }

        const cfg = await Helper.getLatestConfig();
        if (!cfg) {
            console.log('updateScript: abort. getting config failed.');
            return;
        }

        if (VERSION >= cfg.version) {
            console.log('updateScript: skip. provided version not newer than current or invalid');
            _data['lastCheck'] = currentDate;
            cfm.write(_data, '.data.json', FileType.JSON, true); // .data.json is stored in configDir
            return;
        }

        cfm.write(cfg, '.default', FileType.JSON);

        console.log('updateScript: getting new script');

        const request = new Request(HTTP_SCRIPT);
        request.timeoutInterval = 10;

        let script;
        try {
            script = await request.loadString();
        } catch (e) {
            console.log('updateScript: requesting script failed');
            console.log(e);
            return;
        }
        const resp = request.response;
        if (!resp.statusCode || resp.statusCode !== 200) {
            console.warn('updateScript: aborting (error loading new script)');
            return;
        }
        if (script === '') {
            console.log('updateScript: aborting (received empty script)');
            return;
        }
        const currentFile = ENV.script.filename;
        const backupFile = currentFile.replace('.js', '.bak.js');

        // `CustomFileManager` defaults to the baseDir.
        // Since the script is not in it we need to set `baseDir` to `false` on any call to `cfm`
        try {
            if (cfm.fileExists(backupFile, false)) await cfm.remove(backupFile, false);
            cfm.copy(currentFile, backupFile, false);
            cfm.write(script, currentFile, FileType.OTHER, false);
            cfm.remove(backupFile, false);
            _data['lastUpdated'] = _data['lastCheck'] = currentDate;
            cfm.write(_data, '.data.json', FileType.JSON, true); // .data.json is stored in configDir
            console.log('updateScript: script updated');
        } catch (e) {
            console.warn(e);
            console.warn('updateScript: update failed, rolling back...');
            if (cfm.fileExists(backupFile, false)) {
                cfm.copy(backupFile, currentFile, false);
                cfm.remove(backupFile, false);
            }
        }
    }

    static checkLatest(current: string, version?: string): boolean {
        console.log(current + ' ' + version);
        const arrayCurrent = current.split('.');
        if (arrayCurrent.length < 2 || arrayCurrent.length > 3) {
            console.warn(`checkLatest: invalid current version '${version}'`);
            return false;
        }

        if (!version) {
            console.warn(`checkLatest: no version to compare provided.`);
            return false;
        }

        const arrayVersion = version.split('.');
        if (arrayVersion.length < 2 || arrayVersion.length > 3) {
            console.warn(`checkLatest: invalid version '${version}'`);
            return false;
        }

        for (let i = 0; i < arrayVersion.length; i++) {
            if (arrayCurrent[i] < arrayVersion[i]) {
                return true;
            }
        }
        return false;
    }
}

enum RequestType {
    JSON = 'json',
    STRING = 'string'
}

interface ApiVaccinated {
    vaccinated: number,
    difference_to_the_previous_day,
    quote,
}

interface ApiVaccineData extends ApiVaccinated {
    vaccinations_per_1000_inhabitants: number,
    quote: number,
    '2nd_vaccination': ApiVaccinated
}

interface RkiServiceInterface {
    cache: Map<string, any>

    locationData: ({longitude, latitude}: { latitude: number, longitude: number }) => Promise<any>;
    casesArea: (id: string) => Promise<boolean | IncidenceValue[]>;
    casesState: (id: string) => Promise<boolean | IncidenceValue[]>;
    casesGer: () => Promise<boolean | IncidenceValue[]>;
    rData: () => Promise<Rdata>;
    getCases: (urlToday: string, urlHistory: string) => Promise<boolean | IncidenceValue[]>;
    exec: (url: string, type: RequestType) => Promise<DataResponse<any>>;
    execCached: (url: string, type: RequestType) => Promise<DataResponse<any>>;

}

class RkiService /*implements RkiServiceInterface*/ {
    cache: Map<string, DataResponse<{ [p: string]: any } | string> | EmptyResponse>;

    constructor() {
        this.cache = new Map();
    }

    private static async execJson(url: string): Promise<DataResponse<null> | DataResponse<{ [p: string]: any }>> {
        const req = new Request(url);
        req.timeoutInterval = 20;

        let data;
        try {
            data = await req.loadJSON();
        } catch (e) {
            console.warn(`RkiService.execJson: ${url}`)
            console.warn(e);
            return DataResponse.error('Error requesting data.')
        }
        const response = req.response;

        if (response.statusCode !== undefined && response.statusCode === 200) {
            return new DataResponse<any>(data);
        } else if (response.statusCode !== undefined && response.statusCode === 404) {
            return DataResponse.notFound('Request returned: 404 NOT FOUND');

        } else {
            return DataResponse.error(`Unexpected status. (${response.statusCode}).`)
        }
    }

    private static async execString(url: string) {
        const req = new Request(url);
        req.timeoutInterval = 20;


        let data;
        try {
            data = await req.loadString();
        } catch (e) {
            console.warn(e);
            return DataResponse.error('Error requesting data.')
        }
        return data.length > 0 ? new DataResponse<any>(data) : DataResponse.notFound();
    }

    async exec(url: string, type: RequestType = RequestType.JSON): Promise<DataResponse<{ [p: string]: any } | string> | EmptyResponse> {
        try {
            if (type === RequestType.JSON) {
                return RkiService.execJson(url);
            } else if (type === RequestType.STRING) {
                return RkiService.execString(url);
            } else {
                return DataResponse.error(`Request of type '${RequestType}' are not supported.`);
            }
        } catch (e) {
            console.warn(`RKIService.exec: ${url}, ${type}`)
            console.warn(e);
            return DataResponse.error(`Request failed. (${url})`);
        }
    }

    async execCached(url: string): Promise<DataResponse<{ [p: string]: any }> | EmptyResponse>;
    async execCached(url: string, type: RequestType.JSON): Promise<DataResponse<{ [p: string]: any }> | EmptyResponse>;
    async execCached(url: string, type: RequestType.STRING): Promise<DataResponse<string> | EmptyResponse>;
    async execCached(url: string, type: RequestType = RequestType.JSON): Promise<DataResponse<{ [p: string]: any } | string | null>> {
        const cacheKey = type + '_' + url;
        const cached = this.cache.get(cacheKey);

        let res: DataResponse<Record<string, unknown> | string> | EmptyResponse;
        if (typeof cached === 'undefined') {
            res = await this.exec(url, type);
            if (res.status === DataStatus.OK) {
                this.cache.set(cacheKey, res);
            }
        } else {
            res = cached;
        }
        return res;
    }

    async casesArea(id: string): Promise<false | IncidenceValue[]> {
        const apiStartDate = Helper.getDateBefore(CFG.def.maxShownDays + 7);
        const urlToday = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1,-1)%20AND%20IdLandkreis%3D${id}&objectIds&time&resultType=standard&outFields&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields&groupByFieldsForStatistics&outStatistics=%5B%7B%22statisticType%22:%22sum%22,%22onStatisticField%22:%22AnzahlFall%22,%22outStatisticFieldName%22:%22cases%22%7D,%20%7B%22statisticType%22:%22max%22,%22onStatisticField%22:%22MeldeDatum%22,%22outStatisticFieldName%22:%22date%22%7D%5D&having&resultOffset&resultRecordCount&sqlFormat=none&token`
        const urlHistory = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=NeuerFall+IN%281%2C0%29+AND+IdLandkreis=${id}+AND+MeldeDatum+%3E%3D+TIMESTAMP+%27${apiStartDate}%27&objectIds=&time=&resultType=standard&outFields=AnzahlFall%2CMeldeDatum&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=MeldeDatum&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22cases%22%7D%5D%0D%0A&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token=`
        const hist = await this.getCases(urlToday, urlHistory);
        console.log(hist);
        return typeof hist === 'boolean' ? hist : IncidenceData.completeHistory(hist, CFG.def.maxShownDays + 7, new Date().setHours(0, 0, 0, 0));
    }

    async casesGer(): Promise<false | IncidenceValue[]> {
        const apiStartDate = Helper.getDateBefore(CFG.def.maxShownDays + 7);
        let urlToday = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1,-1)&returnGeometry=false&geometry=42.000,12.000&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22,%22onStatisticField%22%3A%22AnzahlFall%22,%22outStatisticFieldName%22%3A%22cases%22%7D%5D&resultType=standard&cacheHint=true`;
        urlToday += `&groupByFieldsForStatistics=MeldeDatum`;
        const urlHistory = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=NeuerFall+IN%281%2C0%29+AND+MeldeDatum+%3E%3D+TIMESTAMP+%27${apiStartDate}%27&objectIds=&time=&resultType=standard&outFields=AnzahlFall%2CMeldeDatum&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=MeldeDatum&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22cases%22%7D%5D%0D%0A&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token=`;
        const hist = await this.getCases(urlToday, urlHistory);
        return typeof hist === 'boolean' ? hist : IncidenceData.completeHistory(hist, CFG.def.maxShownDays + 7, new Date().setHours(0, 0, 0, 0));

    }

    async casesState(id: string): Promise<false | IncidenceValue[]> {
        const apiStartDate = Helper.getDateBefore(CFG.def.maxShownDays + 7);
        const urlToday = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1,%20-1)+AND+IdBundesland=${id}&objectIds=&time=&resultType=standard&outFields=&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22,%22onStatisticField%22%3A%22AnzahlFall%22,%22outStatisticFieldName%22%3A%22cases%22%7D%5D&having=&resultOffset=&resultRecordCount=&sqlFormat=none&token=`;
        const urlHistory = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=NeuerFall+IN%281%2C0%29+AND+IdBundesland=${id}+AND+MeldeDatum+%3E%3D+TIMESTAMP+%27${apiStartDate}%27&objectIds=&time=&resultType=standard&outFields=AnzahlFall%2CMeldeDatum&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=MeldeDatum&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22cases%22%7D%5D%0D%0A&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token=`
        const hist = await this.getCases(urlToday, urlHistory);
        return typeof hist === 'boolean' ? hist : IncidenceData.completeHistory(hist, CFG.def.maxShownDays + 7, new Date().setHours(0, 0, 0, 0));

    }

    async getCases(urlToday: string, urlHistory: string): Promise<false | IncidenceValue[]> {
        const keyCases = 'MeldeDatum';
        const resToday = await this.execCached(urlToday);
        const resHistory = await this.execCached(urlHistory);

        if (resToday.status !== DataStatus.OK || resHistory.status !== DataStatus.OK) {
            console.warn(`RKiService.getCases: requesting cases failed. (today: ${resToday.status} history: ${resHistory.status})`);
            return false;
        }

        let todayCases: number | undefined;
        let lastDateToday: number | undefined;
        let dataToday: IncidenceValue | undefined;
        if (resToday.status === DataStatus.OK && !resToday.isEmpty()) {
            const features = resToday.data.features ?? [];
            if (features.length > 0) {
                todayCases = features.reduce((a, b) => a + b.attributes.cases, 0);
                lastDateToday = Math.max(...resToday.data.features.map(a => a.attributes[keyCases]));
                if (isNaN(lastDateToday)) lastDateToday = new Date().setHours(0, 0, 0, 0);
                dataToday = {
                    cases: todayCases,
                    date: new Date(lastDateToday),
                }
            } else {
                console.warn(`Unexpected response format for resToday. \nurl: ${urlToday}\nreply:${JSON.stringify(resToday)})`);
            }
        }

        let dataHist: IncidenceValue[] = []
        if (resHistory.status === DataStatus.OK && !resHistory.isEmpty()) {
            const features = resHistory.data.features ?? [];
            if (features.length > 0) {
                dataHist = features.map(day => {
                    const date = day.attributes[keyCases];
                    return {
                        cases: day.attributes.cases,
                        date: new Date(date),
                    };
                });
                const lastDateHistory = Math.max(...resHistory.data.features.map(a => a.attributes[keyCases]));

                let lastDate = lastDateHistory;
                if (!lastDateToday || new Date(lastDateToday).setHours(0, 0, 0, 0) <= new Date(lastDateHistory).setHours(0, 0, 0, 0)) {
                    const lastReportDate = new Date(lastDateHistory);
                    lastDate = lastReportDate.setDate(lastReportDate.getDate() + 1);
                } else {
                    lastDate = lastDateToday; // lastDateToday is defined and the latest date
                }

                dataToday = {
                    cases: todayCases,
                    date: new Date(lastDate),
                }
            } else {
                console.warn(`Unexpected response format for resHistory. \nurl: ${urlHistory}\nreply:${JSON.stringify(resHistory)})`);
            }
        }

        const data: IncidenceValue[] = dataToday !== undefined ? [...dataHist, dataToday] : dataHist;
        data.sort((a, b) => a.date.getTime() - b.date.getTime());
        return data;
    }

    async locationData({latitude, longitude}: { latitude: number; longitude: number }): Promise<false | ApiMetaArea> {
        const lon = longitude.toFixed(3);
        const lat = latitude.toFixed(3);
        const outputFields = 'GEN,RS,EWZ,EWZ_BL,BL_ID,cases,cases_per_100k,cases7_per_100k,cases7_bl_per_100k,last_update,BL,IBZ';
        const url = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=${outputFields}&geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;
        const response = await this.execCached(url);

        if (response.status !== DataStatus.OK || response.isEmpty()) {
            return false;
        }

        const features = response.data.features;
        if (!features) {
            console.warn(`Unexpected response format. \nurl: ${url}\nreply:${JSON.stringify(response.data)})`);
            return false;
        }

        const meta = features[0].attributes ?? false;
        if (RkiService.isApiMetaArea(meta)) {
            return meta;
        } else {
            console.warn(`Obtained data is no 'ApiMetaArea'. (${lat},${lon})`);
            return false;
        }
    }

    async vaccineData(): Promise<false | { [p: string]: string }> {
        const url = `https://rki-vaccination-data.vercel.app/api`
        const response = await this.execCached(url, RequestType.JSON);
        if (response.status === DataStatus.OK && !response.isEmpty()) {
            return (response.data.states) ? response.data : false;
        } else {
            console.warn(`Unexpected response format. \nurl: ${url}\nreply:${JSON.stringify(response.data)})`);
            return false;
        }
    }

    async rData(): Promise<Rdata> {
        const url = `https://raw.githubusercontent.com/robert-koch-institut/SARS-CoV-2-Nowcasting_und_-R-Schaetzung/main/Nowcast_R_aktuell.csv`;
        const response = await this.execCached(url, RequestType.STRING);

        if (response.status === DataStatus.OK && !response.isEmpty()) {
            return Format.rValue(response.data);
        } else {
            return {date: null, r: 0};
        }
    }

    static isApiMetaArea(meta: any): meta is ApiMetaArea {
        const keys = ['BL', 'BL_ID', 'cases', 'cases7_bl_per_100k', 'cases_per_100k', 'EWZ', 'EWZ_BL', 'GEN', 'last_update', 'IBZ', 'RS'];
        return Helper.keysAreDefined(meta, keys, 'ApiMetaArea');
    }

    static isApiVaccineData(data: any): data is ApiVaccineData {
        const keys = ['2nd_vaccination', 'vaccinations_per_1000_inhabitants', 'quote'];
        return RkiService.isApiVaccinated(data) && Helper.keysAreDefined(data, keys, 'ApiVaccineData') && RkiService.isApiVaccinated(data['2nd_vaccination']);
    }

    static isApiVaccinated(data: any): data is ApiVaccinated {
        const keys = ['vaccinated', 'difference_to_the_previous_day'];
        return Helper.keysAreDefined(data, keys, 'ApiVaccinated');
    }

}

console.log(`Version: ${VERSION}`);
const cfm = new CustomFileManager(DIR, FILE);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
await Helper.migrateConfig();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
await Helper.loadConfig();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
await Helper.updateScript();

const defaultSmall = '';
const defaultMedium = '0;1,52.02,8.54';
const defaultLarge = '0; 1,52.02,8.54; 2,48.11,11.60; 3,50.94,7.00; 4,50.11,8.67; 5,48.78,9.19; 6,51.22,6.77';

const widget = new IncidenceListWidget(new RkiService(), args.widgetParameter ?? defaultLarge, config.widgetFamily, [], CFG.def);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
Script.setWidget(await widget.init());
Script.complete();
