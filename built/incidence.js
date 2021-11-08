// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: briefcase-medical;
// Licence: Robert-Koch-Institut (RKI), dl-de/by-2-0 (https://www.govdata.de/dl-de/by-2-0)
const CFG = {
    config: "1.2",
    version: '1.8',
    autoUpdate: true,
    autoUpdateInterval: 1,
    geoCacheAccuracy: 1,
    def: {
        cacheMaxAge: 3600,
        maxShownDays: 28,
        graphUpsideDown: false,
        graphShowIndex: 'incidence',
        stateUseShortName: true,
        refreshInterval: 3600,
        openUrlOnTap: false,
        openUrl: "https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4",
        alternateLarge: false,
        incidenceDisableLive: false,
        showVaccine: true, // show the data regarding the vaccination. Small widget wont show this information.
    },
    widgets: {},
};
const VERSION = '1.8';
const HTTP_SCRIPT = 'https://raw.githubusercontent.com/TiborAdk/corona-widget-ts/master/built/incidence.js';
const HTTP_CONFIG = 'https://raw.githubusercontent.com/TiborAdk/corona-widget-ts/master/config.json';
const DIR_DEV = 'corona_widget_dev';
const FILE_DEV = 'dev';
const DIR = 'corona_widget_ts';
const FILE = 'corona_widget';
const CSV_RVALUE_FIELDS = ['Schätzer_7_Tage_R_Wert', 'Punktschätzer des 7-Tage-R Wertes', 'Schไtzer_7_Tage_R_Wert', 'Punktschไtzer des 7-Tage-R Wertes', 'PS_7_Tage_R_Wert'];
var AreaType;
(function (AreaType) {
    AreaType["KS"] = "KS";
    AreaType["SK"] = "SK";
    AreaType["K"] = "K";
    AreaType["LK"] = "LK";
    AreaType["SV_K"] = "SV_K";
    AreaType["SV_LK"] = "SV_LK";
    AreaType["BZ"] = "BZ";
})(AreaType || (AreaType = {}));
const ENV = {
    state: { nameIndex: CFG.def.stateUseShortName ? 'short' : 'name' },
    areaIBZ: new Map([
        [40, AreaType.KS],
        [41, AreaType.SK],
        [42, AreaType.K],
        [43, AreaType.LK],
        [45, AreaType.SV_K],
        [46, AreaType.SV_LK], // Sonderverband offiziell Landkreis
    ]),
    cacheAreas: new Map(),
    cacheCountries: new Map(),
    cacheStates: new Map(),
    cacheVaccines: new Map(),
    states: new Map([
        ['1', { short: 'SH', name: 'Schleswig-Holstein' }],
        ['2', { short: 'HH', name: 'Hamburg' }],
        ['3', { short: 'NI', name: 'Niedersachsen' }],
        ['4', { short: 'HB', name: 'Bremen' }],
        ['5', { short: 'NRW', name: 'Nordrhein-Westfalen' }],
        ['6', { short: 'HE', name: 'Hessen' }],
        ['7', { short: 'RP', name: 'Rheinland-Pfalz' }],
        ['8', { short: 'BW', name: 'Baden-Württemberg' }],
        ['9', { short: 'BY', name: 'Bayern' }],
        ['10', { short: 'SL', name: 'Saarland' }],
        ['11', { short: 'BE', name: 'Berlin' }],
        ['12', { short: 'BB', name: 'Brandenburg' }],
        ['13', { short: 'MV', name: 'Mecklenburg-Vorpommern' }],
        ['14', { short: 'SN', name: 'Sachsen' }],
        ['15', { short: 'ST', name: 'Sachsen-Anhalt' }],
        ['16', { short: 'TH', name: 'Thüringen' }],
    ]),
    script: {
        filename: this.module.filename.replace(/^.*[\\/]/, ''),
    },
};
var DataStatus;
(function (DataStatus) {
    DataStatus["OK"] = "OK";
    DataStatus["OFFLINE"] = "offline";
    DataStatus["CACHED"] = "cached";
    DataStatus["ERROR"] = "error";
    DataStatus["NOT_FOUND"] = "not found}";
    DataStatus["API_ERROR"] = "api error";
})(DataStatus || (DataStatus = {}));
var IncidenceTrend;
(function (IncidenceTrend) {
    IncidenceTrend["DAY"] = "day";
    IncidenceTrend["WEEK"] = "week";
})(IncidenceTrend || (IncidenceTrend = {}));
var TrendArrow;
(function (TrendArrow) {
    TrendArrow["UP"] = "\u2191";
    TrendArrow["DOWN"] = "\u2193";
    TrendArrow["RIGHT"] = "\u2192";
    TrendArrow["UP_RIGHT"] = "\u2197";
})(TrendArrow || (TrendArrow = {}));
class Colors {
}
Colors.WARN = new Color('#dbc43d', 1);
Colors.DARKDARKRED = new Color('#6b1200', 1);
Colors.DARKRED = new Color('#a1232b', 1);
Colors.RED = Color.dynamic(new Color('#ff3b30', 1), new Color('#ff453a', 1)); // new Color('#f6000f', 1);
Colors.ORANGE = Color.dynamic(new Color('#ff9500', 1), new Color('#ff9f0a', 1)); //new Color('#ff7927', 1);
Colors.YELLOW = Color.dynamic(new Color('#ffcc00', 1), new Color('#ffd60a', 1)); //new Color('#f5d800', 1);
Colors.GREEN = Color.dynamic(new Color('#34c759', 1), new Color('#30d158', 1)); //new Color('#1CC747', 1);
Colors.GRAY = new Color('#d0d0d0', 1);
Colors.DEBUG_BLUE = new Color('#0047bb', 1);
Colors.DEBUG_GREEN = new Color('#00b140', 1);
Colors.BLACK = Color.black();
Colors.WHITE = Color.white();
Colors.FOREGROUND = Color.dynamic(Colors.BLACK, Colors.WHITE);
Colors.BACKGROUND = Color.dynamic(Colors.WHITE, Colors.BLACK);
Colors.BACKGROUND2 = Color.dynamic(new Color('#f2f2f7', 1), new Color('#1c1c1e', 1));
Colors.BACKGROUND3 = Color.dynamic(new Color('#e5e5ea', 1), new Color('#2c2c2e', 1));
Colors.BACKGROUND4 = Color.dynamic(new Color('#d1d1d6', 1), new Color('#3a3a3c', 1));
function partial(fn, first) {
    return (...last) => {
        return fn(first, ...last);
    };
}
class CustomFont extends Font {
    constructor(name, size) {
        super(name, size);
        this.size = size;
        this.create = () => {
            throw Error('Not implemented');
        };
    }
    bigger(offset) {
        return this.create(this.size + offset);
    }
    smaller(offset) {
        return this.bigger(-offset);
    }
    newSizedByOffset(offset) {
        return this.bigger(offset);
    }
    static bold(size) {
        return CustomFont.fromFont(Font.boldSystemFont, size);
    }
    static medium(size) {
        return CustomFont.fromFont(Font.mediumSystemFont, size);
    }
    static boldMono(size) {
        return CustomFont.fromFont(Font.boldMonospacedSystemFont, size);
    }
    static mediumMono(size) {
        return CustomFont.fromFont(Font.mediumMonospacedSystemFont, size);
    }
    static boldRounded(size) {
        return CustomFont.fromFont(Font.mediumMonospacedSystemFont, size);
    }
    static fromFont(create, size) {
        const custom = create(size);
        custom.size = size;
        custom.create = partial(CustomFont.fromFont, create);
        custom.bigger = function (offset) {
            return custom.create(custom.size + offset);
        };
        custom.smaller = function (offset) {
            return custom.bigger(-offset);
        };
        custom.newSizedByOffset = function (size) {
            return custom.bigger(size);
        };
        return custom;
    }
}
CustomFont.XLARGE = CustomFont.bold(26);
CustomFont.LARGE = CustomFont.medium(20);
CustomFont.MEDIUM = CustomFont.medium(14);
CustomFont.NORMAL = CustomFont.medium(12);
CustomFont.SMALL = CustomFont.bold(11);
CustomFont.SMALL2 = CustomFont.bold(10);
CustomFont.XSMALL = CustomFont.bold(9);
CustomFont.XLARGE_MONO = CustomFont.boldMono(26);
CustomFont.LARGE_MONO = CustomFont.mediumMono(20);
CustomFont.MEDIUM_MONO = CustomFont.mediumMono(14);
CustomFont.NORMAL_MONO = CustomFont.mediumMono(12);
CustomFont.SMALL_MONO = CustomFont.boldMono(11);
CustomFont.SMALL2_MONO = CustomFont.boldMono(10);
CustomFont.XSMALL_MONO = CustomFont.boldMono(9);
class Incidence {
}
Incidence.DARKDARKRED = { limit: 250, color: Colors.DARKDARKRED };
Incidence.DARKRED = { limit: 100, color: Colors.DARKRED };
Incidence.RED = { limit: 50, color: Colors.RED };
Incidence.ORANGE = { limit: 25, color: Colors.ORANGE };
Incidence.YELLOW = { limit: 5, color: Colors.YELLOW };
Incidence.GREEN = { limit: 0, color: Colors.GREEN };
Incidence.GRAY = { limit: Number.NEGATIVE_INFINITY, color: Colors.GRAY };
var WidgetFamily;
(function (WidgetFamily) {
    WidgetFamily["SMALL"] = "small";
    WidgetFamily["MEDIUM"] = "medium";
    WidgetFamily["LARGE"] = "large";
})(WidgetFamily || (WidgetFamily = {}));
var WidgetSize;
(function (WidgetSize) {
    WidgetSize[WidgetSize["SMALL"] = 0] = "SMALL";
    WidgetSize[WidgetSize["MEDIUM"] = 1] = "MEDIUM";
    WidgetSize[WidgetSize["LARGE"] = 2] = "LARGE";
})(WidgetSize || (WidgetSize = {}));
var Layout;
(function (Layout) {
    Layout["HORIZONTAL"] = "h";
    Layout["VERTICAL"] = "v";
})(Layout || (Layout = {}));
var Align;
(function (Align) {
    Align["LEFT"] = "align_left";
    Align["CENTER"] = "align_center";
    Align["RIGHT"] = "align_right";
})(Align || (Align = {}));
var AlignContent;
(function (AlignContent) {
    AlignContent["TOP"] = "align_top";
    AlignContent["CENTER"] = "align_center";
    AlignContent["BOTTOM"] = "align_bottom";
})(AlignContent || (AlignContent = {}));
class StackLikeWrapper {
    constructor(elem, font, textColor) {
        this.elem = elem;
        this.font = font;
        this.textColor = textColor;
    }
    get backgroundColor() {
        return this.elem.backgroundColor;
    }
    set backgroundColor(value) {
        this.elem.backgroundColor = value;
    }
    get backgroundGradient() {
        return this.elem.backgroundGradient;
    }
    set backgroundGradient(value) {
        this.elem.backgroundGradient = value;
    }
    get backgroundImage() {
        return this.elem.backgroundImage;
    }
    set backgroundImage(value) {
        this.elem.backgroundImage = value;
    }
    get spacing() {
        return this.elem.spacing;
    }
    set spacing(value) {
        this.elem.spacing = value;
    }
    get url() {
        return this.elem.url;
    }
    set url(value) {
        this.elem.url = value;
    }
    addDate(date, properties = {}) {
        const widgetDate = this.elem.addDate(date);
        return CustomWidgetStack.applyTextProperties2Element(widgetDate, this.inheritProperties(properties));
    }
    addImage(image, properties = {}) {
        const { resizable, imageSize, imageOpacity, borderWidth, borderColor, containerRelativeShape, tintColor, url, align } = properties;
        const widgetImage = this.elem.addImage(image);
        if (resizable)
            widgetImage.resizable = resizable;
        if (imageSize)
            widgetImage.imageSize = imageSize;
        if (imageOpacity)
            widgetImage.imageOpacity = imageOpacity;
        if (borderWidth)
            widgetImage.borderWidth = borderWidth;
        if (borderColor)
            UI.setColorOfElementByIndex(widgetImage, 'borderColor', borderColor);
        if (containerRelativeShape)
            widgetImage.containerRelativeShape = containerRelativeShape;
        if (tintColor)
            UI.setColorOfElementByIndex(widgetImage, 'tintColor', tintColor);
        if (url)
            widgetImage.url = url;
        if (align === Align.LEFT) {
            widgetImage.leftAlignImage();
        }
        else if (align === Align.CENTER) {
            widgetImage.centerAlignImage();
        }
        else if (align === Align.RIGHT) {
            widgetImage.rightAlignImage();
        }
        return widgetImage;
    }
    addSpacer(length) {
        return this.elem.addSpacer(length);
    }
    addStack(properties = {}) {
        return new CustomWidgetStack(this.elem.addStack(), this.inheritProperties(properties));
    }
    addText(text, properties = {}) {
        const widgetText = this.elem.addText(text);
        return StackLikeWrapper.applyTextProperties2Element(widgetText, this.inheritProperties(properties));
    }
    setPadding(top, leading, bottom, trailing) {
        this.elem.setPadding(top, leading, bottom, trailing);
    }
    useDefaultPadding() {
        this.elem.useDefaultPadding();
    }
    inheritProperties(params) {
        // 'Children' inherit font and text color
        if (!params.font)
            params.font = this.font;
        if (!params.textColor)
            params.textColor = this.textColor;
        return params;
    }
    static applyTextProperties2Element(elem, properties = {}) {
        const { textOpacity, textColor, url, lineLimit, minimumScaleFactor, font } = properties;
        if (textColor)
            UI.setColorOfElementByIndex(elem, 'textColor', textColor);
        if (font)
            elem.font = font;
        if (textOpacity)
            elem.textOpacity = textOpacity;
        if (lineLimit)
            elem.lineLimit = lineLimit;
        if (minimumScaleFactor)
            elem.minimumScaleFactor = minimumScaleFactor;
        if (url)
            elem.url = url;
        return elem;
    }
}
/**
 * Wrapper around {@link WidgetStack} to allow setting of properties when adding {@link WidgetText}, {@link WidgetDate}, {@link WidgetImage} or {@link WidgetStack}.
 * Content of created Stacks with `addStack()` will be center-align by default.
 */
class CustomWidgetStack extends StackLikeWrapper {
    constructor(stack, params = {}) {
        const { font, textColor, } = params;
        super(stack, font, textColor);
        CustomWidgetStack.applyParameters2Stack(this, params);
    }
    get size() {
        return this.elem.size;
    }
    set size(size) {
        this.elem.size = size;
    }
    get cornerRadius() {
        return this.elem.cornerRadius;
    }
    set cornerRadius(radius) {
        this.elem.cornerRadius = radius;
    }
    get borderWidth() {
        return this.elem.borderWidth;
    }
    set borderWidth(width) {
        this.elem.borderWidth = width;
    }
    get borderColor() {
        return this.elem.borderColor;
    }
    set borderColor(color) {
        this.elem.borderColor = color;
    }
    static applyParameters2Stack(stack, properties = {}) {
        const { layout, font, textColor, bgColor, spacing, size, cornerRadius, borderWidth, borderColor, url, bgImage, bgGradient, alignContent, padding } = properties;
        if (size)
            stack.size = size;
        if (layout === Layout.HORIZONTAL) {
            stack.layoutHorizontally();
        }
        else if (layout === Layout.VERTICAL) {
            stack.layoutVertically();
        }
        if (alignContent === AlignContent.TOP) {
            stack.topAlignContent();
        }
        else if (alignContent === AlignContent.CENTER) {
            stack.centerAlignContent();
        }
        else if (alignContent === AlignContent.BOTTOM) {
            stack.bottomAlignContent();
        }
        else {
            // default
            stack.centerAlignContent();
        }
        if (font)
            stack.font = font;
        if (textColor)
            stack.textColor = textColor;
        if (bgColor)
            stack.setBackgroundColor(bgColor);
        if (bgImage)
            stack.backgroundImage = bgImage;
        if (bgGradient)
            stack.backgroundGradient = bgGradient;
        if (spacing)
            stack.spacing = spacing;
        if (cornerRadius)
            stack.cornerRadius = cornerRadius;
        if (borderWidth)
            stack.borderWidth = borderWidth;
        if (borderColor)
            stack.setBorderColor(borderColor);
        if (url)
            stack.url = url;
        if (padding)
            stack.setPadding(...padding);
        return stack;
    }
    bottomAlignContent() {
        this.elem.bottomAlignContent();
    }
    centerAlignContent() {
        this.elem.centerAlignContent();
    }
    layoutHorizontally() {
        this.elem.layoutHorizontally();
    }
    layoutVertically() {
        this.elem.layoutVertically();
    }
    topAlignContent() {
        this.elem.topAlignContent();
    }
    setBackgroundColor(color) {
        UI.setColorOfElementByIndex(this.elem, 'backgroundColor', color);
    }
    setBorderColor(color) {
        UI.setColorOfElementByIndex(this.elem, 'borderColor', color);
    }
}
class CustomListWidget extends StackLikeWrapper {
    constructor(parameters, family, font, textColor) {
        super(new ListWidget(), font, textColor);
        this.parameters = parameters;
        if (CustomListWidget.isWidgetFamily(family)) {
            console.log('Setting size by family.');
            this.setSizeByWidgetFamily(family);
        }
        else {
            console.warn(`Unknown widget family '${family}'.`);
        }
        this.font = font;
        this.textColor = textColor;
    }
    setSizeByWidgetFamily(family) {
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
    async init() {
        await this.setup();
        await this.fillWidget();
        // this.setPadding(0);
        if (!config.runsInWidget) {
            await this.present();
        }
        return this.elem;
    }
    isLarge() {
        return CustomListWidget.isLarge(this.size);
    }
    isMedium() {
        return CustomListWidget.isMedium(this.size);
    }
    isSmall() {
        return CustomListWidget.isSmall(this.size);
    }
    static isLarge(size) {
        return size === WidgetSize.LARGE;
    }
    static isMedium(size) {
        return size === WidgetSize.MEDIUM;
    }
    static isSmall(size) {
        return size === WidgetSize.SMALL;
    }
    static isWidgetFamily(family) {
        return Object.values(WidgetFamily).includes(family);
    }
    get refreshAfterDate() {
        return this.elem.refreshAfterDate;
    }
    set refreshAfterDate(date) {
        this.elem.refreshAfterDate = date;
    }
    setSizeByParameterCount(count) {
        if (count < 0) {
            throw `count must be at least 0 (is: ${count})`;
        }
        else if (count < 2) {
            this.size = WidgetSize.SMALL;
        }
        else if (count < 3) {
            this.size = WidgetSize.MEDIUM;
        }
        else if (count <= 6) {
            this.size = WidgetSize.LARGE;
        }
        else {
            this.size = WidgetSize.LARGE;
            console.warn(`count larger than 6 (${count})`);
        }
    }
    presentLarge() {
        return Promise.resolve(this.elem.presentLarge());
    }
    presentMedium() {
        return Promise.resolve(this.elem.presentMedium());
    }
    presentSmall() {
        return Promise.resolve(this.elem.presentSmall());
    }
    async present() {
        if (this.isLarge()) {
            await this.presentLarge();
        }
        else if (this.isMedium()) {
            await this.presentMedium();
        }
        else if (this.isSmall()) {
            await this.presentSmall();
        }
        else {
            // medium as default
            await this.presentMedium();
        }
    }
}
function emptyImage() {
    return Image.fromData(Data.fromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAgcBApocMXEAAAAASUVORK5CYII='));
}
class StatusBlockStack extends CustomWidgetStack {
    constructor(stack, status, showText = false, size) {
        super(stack, { layout: Layout.VERTICAL, font: CustomFont.SMALL, size });
        this.showText = showText;
        this.iconText = this.addText('');
        if (this.showText)
            this.textText = this.addText('', { font: CustomFont.XSMALL, textColor: '#999999' });
        if (status)
            this.setStatus(status);
    }
    setIcon(icon) {
        this.iconText.text = icon;
    }
    setText(text) {
        if (this.textText)
            this.textText.text = text;
    }
    setStatus(dataStatus, location) {
        let icon;
        let text;
        if (location && location.type === LocationType.CURRENT) {
            if (dataStatus === DataStatus.OK) {
                [icon, text] = UI.getLocStatusIconAndText(location.status, location.type);
            }
            else if (dataStatus === DataStatus.CACHED) {
                [icon, text] = UI.getLocStatusIconAndText(LocationStatus.CACHED, location.type);
            }
            else {
                [icon, text] = UI.getStatusIconAndText(dataStatus);
            }
        }
        else {
            [icon, text] = UI.getStatusIconAndText(dataStatus);
        }
        if (icon && text) {
            this.setIcon(icon);
            if (this.showText)
                this.setText(text);
        }
    }
}
class IncidenceContainer extends CustomWidgetStack {
    constructor(stack, incidence, font = CustomFont.NORMAL, fontSizeOffset, arrow, fontArrow, size) {
        super(stack, { layout: Layout.HORIZONTAL, font, size, });
        const fontSmaller = font.newSizedByOffset(fontSizeOffset ?? 0);
        this.part0 = this.addText('', { font, lineLimit: 1, minimumScaleFactor: 1 });
        this.part1 = this.addText('', { font: fontSmaller, lineLimit: 1, minimumScaleFactor: 0.5 });
        // this.addSpacer(); // align arrow right
        this.arrowText = this.addText('', { font: fontArrow, lineLimit: 1, minimumScaleFactor: 1 });
        // this.addSpacer(); // align all left
        if (incidence)
            this.setIncidence(incidence);
        if (arrow)
            this.setArrow(arrow);
    }
    setIncidence(incidence) {
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
            }
            else {
                this.part0.text = '' + Math.round(incidence);
                this.part1.text = '';
            }
        }
        else {
            this.part0.text = 'n/v';
            this.part1.text = '';
        }
    }
    setArrow(arrow) {
        this.arrowText.text = arrow;
        this.arrowText.textColor = UI.getTrendArrowColor(arrow);
    }
}
class HistoryCasesStack extends CustomWidgetStack {
    constructor(stack, graphSize, font, properties = { spacing: 1, }) {
        const { spacing, padding, align, imageOpacity, graphResizable } = properties;
        const size = properties.size ?? new Size(graphSize.width, 0);
        super(stack, { layout: Layout.VERTICAL, spacing, font, padding, size });
        this.graphSize = graphSize;
        this.graphImage = this.addImage(emptyImage(), { imageOpacity });
        this.graphResizable = graphResizable ?? false;
        const casesStack = this.addStack({ layout: Layout.HORIZONTAL });
        if (align === undefined || align === Align.RIGHT || align === Align.CENTER)
            casesStack.addSpacer();
        this.casesText = casesStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.9 });
        if (align === Align.LEFT || align === Align.CENTER)
            casesStack.addSpacer();
    }
    setCases(cases) {
        //console.log(`HistoryCasesStack.setCases: cases: ${cases}`);
        this.casesText.text = cases !== undefined && cases >= 0 ? '+' + cases : 'n/v';
    }
    setGraph(data, minmax) {
        this.graphImage.image = UI.generateGraph(data, this.graphSize, minmax, CFG.def.graphShowIndex, 'incidence', Align.RIGHT).getImage();
    }
    set graphResizable(resizable) {
        this.graphImage.resizable = resizable;
    }
    get graphResizable() {
        return this.graphImage.resizable;
    }
}
class IncidenceRowStackBase extends CustomWidgetStack {
    constructor(stack, layout, bgColor, size, cornerRadius, padding) {
        super(stack, { layout, bgColor, size, cornerRadius, padding, });
    }
    setName(name) {
        this.nameText.text = name.toUpperCase();
    }
    setCases(cases) {
        this.trendStack.setCases(cases);
        // this.casesText.text = cases !== undefined ? '+' + Format.number(cases) : 'n/v';
    }
    setGraph(data, minmax) {
        this.trendStack.setGraph(data, minmax);
        // this.graphImage.image = UI.generateGraph(data, this.graphSize, {}, maxValues, CFG.def.graphShowIndex, 'incidence', Align.RIGHT).getImage();
    }
    setIncidence(data, incidenceTrend) {
        const incidence = data.getDay()?.incidence ?? 0; // TODO check default value
        const offset = incidenceTrend === IncidenceTrend.DAY ? 1 : 7;
        const incidence1 = data.getDay(offset)?.incidence ?? 0;
        const arrow = UI.getTrendArrow(incidence, incidence1);
        this.incidenceContainer.setIncidence(incidence);
        this.incidenceContainer.setArrow(arrow);
    }
    setData(data, incidenceTrend, minmax) {
        const meta = data.meta;
        this.setName(this.mapMeta2Name(meta));
        this.setCases(data.getDay()?.cases);
        this.setIncidence(data, incidenceTrend);
        this.setGraph(data.data, minmax);
    }
    mapMeta2Name(meta) {
        return meta.short ?? meta.name;
    }
}
class IncidenceVaccineRowStackBase extends IncidenceRowStackBase {
    constructor(stack, layout, bgColor, size, cornerRadius, padding) {
        super(stack, layout, bgColor, size, cornerRadius, padding);
    }
    setVaccineQuote(quote) {
        this.vaccineQuoteText.text = quote > 0 ? Format.number(quote, 2) + '%' : 'n/v';
    }
    setVaccineQuote2nd(quote) {
        this.vaccineQuote2ndText.text = quote > 0 ? '(' + Format.number(quote, 2) + '%)' : '';
    }
    setVaccinated(vaccinated) {
        if (this.vaccinatedText)
            this.vaccinatedText.text = ' (' + Format.number(vaccinated) + ')';
    }
    setVaccineData(data) {
        this.vaccineIconText.text = '💉';
        this.setVaccinated(data.fullyVaccinated.doses);
        this.setVaccineQuote(data.fullyVaccinated.quote);
        //this.setVaccineQuote2nd(data.second_vaccination.quote);
    }
    setData(data, incidenceTrend, minmax) {
        super.setData(data, incidenceTrend, minmax);
        if (data.meta.vaccine) {
            this.setVaccineData(data.meta.vaccine);
        }
    }
}
class SmallIncidenceRowStack extends IncidenceVaccineRowStackBase {
    constructor(stack, data, incidenceTrend, minmax, bgColor = '#99999915') {
        super(stack, Layout.HORIZONTAL, bgColor, undefined, 8, [2, 0, 1, 4]);
        this.textColor = '#999999';
        const ht = 12;
        const hb = 12;
        const width = 145;
        const wl = 76;
        const spacing = 5;
        const wr = width - wl - spacing;
        this.graphSize = new Size(wr, ht - 1);
        const c0 = this.addStack({ layout: Layout.VERTICAL, size: new Size(wl, 0), });
        const nameStack = c0.addStack({ layout: Layout.HORIZONTAL, size: new Size(0, ht - 1) });
        const vaccineStack = c0.addStack({ layout: Layout.HORIZONTAL, size: new Size(0, hb), font: CustomFont.XSMALL });
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
        this.nameText = nameStack.addText('', { font: CustomFont.NORMAL });
        // Vaccine
        vaccineStack.addSpacer();
        this.vaccineIconText = vaccineStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.9 });
        vaccineStack.addSpacer(0);
        this.vaccineQuoteText = vaccineStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.9 });
        vaccineStack.addSpacer(1);
        this.vaccineQuote2ndText = vaccineStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.5 });
        if (data) {
            if (!incidenceTrend)
                console.warn('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }
}
class SmallIncidenceBlockStack extends IncidenceRowStackBase {
    constructor(stack, data, incidenceTrend, minmax) {
        super(stack, Layout.VERTICAL, '#99999915', undefined, 8, [2, 0, 2, 4]);
        this.textColor = '#777777';
        const row0 = this.addStack({ layout: Layout.HORIZONTAL });
        row0.addSpacer(); // align text right
        this.incidenceContainer = new IncidenceContainer(row0.addStack(), undefined, CustomFont.SMALL2, -1);
        this.nameText = row0.addText('', {
            font: CustomFont.SMALL2,
            lineLimit: 1,
            minimumScaleFactor: 1
        });
        const row1 = this.addStack({ layout: Layout.HORIZONTAL });
        row1.addSpacer();
        this.trendStack = new HistoryCasesStack(row1.addStack(), new Size(58, 10), CustomFont.XSMALL, {
            imageOpacity: 0.9,
            graphResizable: false,
        });
        if (data) {
            if (!incidenceTrend)
                console.log('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }
    mapMeta2Name(meta) {
        return meta[ENV.state.nameIndex];
    }
}
class HeaderStack extends CustomWidgetStack {
    constructor(stack, size, title, rValue, type, date) {
        super(stack, { layout: Layout.HORIZONTAL });
        this.isSmall = CustomListWidget.isSmall(size);
        this.titleText = this.addText('', Font.mediumSystemFont(22));
        this.addSpacer(3);
        const middleStack = this.addStack({ layout: Layout.VERTICAL });
        this.addSpacer();
        if (this.isSmall) {
            // add status block
            this.statusBlock = new StatusBlockStack(this.addStack());
        }
        else {
            // add GER block
            this.smallIncidenceRow = new SmallIncidenceRowStack(this.addStack(), undefined, undefined, undefined, '#99999900');
            this.smallIncidenceRow.mapMeta2Name = function (meta) {
                return meta.short ?? meta.name;
            };
        }
        // R
        const rStack = middleStack.addStack({ layout: Layout.HORIZONTAL });
        this.rText = rStack.addText('', { font: CustomFont.MEDIUM });
        rStack.addSpacer(2);
        const info = { font: CustomFont.XSMALL, textColor: '#777777' };
        //const infoStack = rStack.addStack({layout: Layout.VERTICAL, font: CustomFont.XSMALL, textColor: '#777777'});
        this.shownText = rStack.addText('', info);
        this.dateText = middleStack.addText('', info);
        if (title)
            this.setTitle(title);
        if (rValue)
            this.setRValue(rValue);
        if (type)
            this.setTypeText(type);
        if (date)
            this.setDateText(date);
    }
    setTitle(text) {
        this.titleText.text = text;
    }
    setRValue(value) {
        this.rText.text = value > 0 ? Format.number(value, 2) + 'ᴿ' : 'n/v';
    }
    setTypeText(text) {
        this.shownText.text = `RKI (${text})`;
    }
    setDateText(date) {
        this.dateText.text = date !== undefined ? Format.dateStr(date) + ' ' + Format.timeStr(Date.now()) : 'n/v';
    }
    setStatus(dataStatus, location) {
        if (this.isSmall) {
            this.statusBlock.setStatus(dataStatus, location);
        }
        else {
            console.warn('Status cannot be set. Widget is not small.');
        }
    }
    setCountryData(data, incidenceTrend) {
        if (this.isSmall) {
            console.warn('CountryData cannot be set. Widget is small.');
        }
        else {
            this.smallIncidenceRow.setData(data, incidenceTrend);
        }
    }
}
class AreaIconStack extends CustomWidgetStack {
    constructor(stack, areaIBZ) {
        super(stack, {
            layout: Layout.HORIZONTAL,
            font: CustomFont.XSMALL,
            cornerRadius: 2,
            borderWidth: 2,
            borderColor: '#99999930',
            padding: [1, 3, 1, 3]
        });
        this.iconText = this.addText('');
        if (areaIBZ)
            this.setAreaIBZ(areaIBZ);
    }
    setAreaIBZ(areaIBZ) {
        this.iconText.text = UI.getAreaIcon(areaIBZ);
    }
}
class AreaRowStack extends IncidenceRowStackBase {
    constructor(stack, widgetSize, data, incidenceTrend, status, name, minmax, padding, cornerRadius = 10, elemDepth) {
        const isSmall = CustomListWidget.isSmall(widgetSize);
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
        const bgColor = elemDepth ? UI.elementDepth2BgColor(elemDepth) : '#99999920';
        // Name
        let nameStack;
        let minScale;
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
        }
        else {
            row0.setBackgroundColor(bgColor);
            nameStack = row0.addStack({ layout: Layout.HORIZONTAL, font: CustomFont.MEDIUM });
            minScale = 1;
            nameStack.addSpacer(5);
        }
        this.areaIconStack = new AreaIconStack(nameStack.addStack());
        nameStack.addSpacer(3);
        this.nameText = nameStack.addText('', { lineLimit: 1, minimumScaleFactor: minScale });
        if (isSmall)
            nameStack.addSpacer();
        row0.addSpacer();
        if (!CustomListWidget.isSmall(widgetSize)) {
            this.statusBlock = new StatusBlockStack(row0.addStack(), undefined, false);
            row0.addSpacer(5);
        }
        this.trendStack = new HistoryCasesStack(row0.addStack({ textColor: '#888888' }), this.graphSize, CustomFont.XSMALL);
        if (status)
            this.setStatus(status, data?.location);
        if (data) {
            if (!incidenceTrend)
                console.warn('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
            const meta = data.meta;
            const areaName = name && name.length > 0 ? name : meta.name;
            this.setName(areaName);
        }
        else if (name) {
            this.setName(name);
        }
    }
    setStatus(dataStatus, location) {
        if (this.statusBlock && (dataStatus !== DataStatus.OK || location?.type === LocationType.CURRENT)) {
            this.statusBlock.setStatus(dataStatus, location);
        }
    }
    setAreaIBZ(areaIBZ) {
        this.areaIconStack.setAreaIBZ(areaIBZ);
    }
    setData(data, incidenceTrend, minmax) {
        super.setData(data, incidenceTrend, minmax);
        this.setAreaIBZ(data.meta.IBZ);
    }
}
class AreaErrorRowStack extends AreaRowStack {
    constructor(stack, widgetSize, status, name, padding, cornerRadius, elemDepth) {
        super(stack, widgetSize, undefined, undefined, status, name, undefined, padding, cornerRadius, elemDepth);
    }
    addDummyData() {
        const dummyGraphData = [];
        for (let i = 0; i < 21; i++) {
            dummyGraphData.push({ cases: 0, incidence: 0 });
        }
        this.setGraph(dummyGraphData);
        this.incidenceContainer.setIncidence(undefined);
        this.setCases(undefined);
    }
}
class StateRowStack extends IncidenceVaccineRowStackBase {
    constructor(stack, data, incidenceTrend, minmax, bgColor, padding) {
        super(stack, Layout.HORIZONTAL, bgColor, undefined, undefined, padding);
        this.textColor = '#888888';
        this.graphSize = new Size(84, 16); //new Size(71, 11);
        this.nameText = this.addText('', { lineLimit: 1, minimumScaleFactor: 1, font: CustomFont.MEDIUM });
        this.addSpacer(2);
        this.incidenceContainer = new IncidenceContainer(this.addStack(), undefined, CustomFont.boldMono(12), -1, undefined, CustomFont.boldRounded(12));
        this.addSpacer();
        const vaccineStack = this.addStack({ layout: Layout.HORIZONTAL, font: CustomFont.SMALL, spacing: 1, });
        this.addSpacer();
        this.trendStack = new HistoryCasesStack(this.addStack(), this.graphSize, CustomFont.XSMALL, {
            spacing: 1,
            graphResizable: false,
            imageOpacity: 0.75,
        });
        // Vaccine
        this.vaccineIconText = vaccineStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.9 });
        this.vaccineQuoteText = vaccineStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.9 });
        this.vaccineQuote2ndText = vaccineStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.8 });
        this.vaccinatedText = vaccineStack.addText('', { lineLimit: 1, minimumScaleFactor: 0.9 });
        if (data) {
            if (!incidenceTrend)
                console.warn('incidenceTrend not set');
            this.setData(data, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }
    setData(data, incidenceTrend, minmax) {
        super.setData(data, incidenceTrend, minmax);
        if (data.meta.vaccine) {
            this.setVaccineData(data.meta.vaccine);
        }
    }
}
class MultiAreaRowStack extends CustomWidgetStack {
    constructor(stack, widgetSize, elementDepth, dataRows, state, incidenceTrend, minmax) {
        const bgColor = UI.elementDepth2BgColor(elementDepth);
        super(stack, { layout: Layout.VERTICAL, cornerRadius: 10, spacing: 1, bgColor });
        this.elementDepth = elementDepth;
        this.widgetSize = widgetSize;
        this.areas = new Map();
        this.stateStack = new StateRowStack(this.addStack(), state, incidenceTrend, minmax, undefined, [2, 4, 2, 4]);
        this.areaStacks = this.addStack({ layout: Layout.VERTICAL, spacing: 1 });
        if (dataRows) {
            if (!incidenceTrend)
                console.warn('incidenceTrend not set');
            this.addAreas(dataRows, incidenceTrend ?? IncidenceTrend.WEEK, minmax);
        }
    }
    setArea(dataRow, incidenceTrend) {
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
    addArea(dataRow, incidenceTrend, minmax) {
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
        const padding = CustomListWidget.isSmall(this.widgetSize) ? [4, 4, 4, 4] : [2, 4, 2, 4];
        areaStack = new AreaRowStack(this.areaStacks.addStack(), this.widgetSize, dataRow.data, incidenceTrend, dataRow.status, dataRow.name, minmax, padding, 0, this.elementDepth + 1);
        this.areas.set(id, areaStack);
    }
    addAreas(dataRows, incidenceTrend, minmax) {
        dataRows.forEach(row => this.addArea(row, incidenceTrend, minmax));
    }
}
class ListStack extends CustomWidgetStack {
    constructor(stack, widgetSize, layout = Layout.VERTICAL, spacing, maxLength) {
        super(stack, { layout });
        if (spacing) {
            if (spacing < 0) {
                this.dynamicSpacing = true;
            }
            else {
                this.dynamicSpacing = false;
                this.spacing = spacing;
            }
        }
        else {
            this.dynamicSpacing = true;
        }
        this.widgetSize = widgetSize;
        this.maxLength = maxLength;
        this.items = [];
    }
    get length() {
        return this.items.length;
    }
    addItem(data, addSpacer = true, ...args) {
        if (this.maxLength && this.items.length >= this.maxLength) {
            console.warn('Reached max length.');
            return;
        }
        if (this.items.length !== 0 && addSpacer && this.dynamicSpacing)
            this.addSpacer();
        this.items.push(this.createItem(data, ...args));
    }
    addItems(data, ...args) {
        if (this.maxLength && data.length > this.maxLength) {
            console.warn('To many states provided.');
        }
        else if (data.length < 1) {
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
    constructor(stack, widgetSize, incidenceTrend, dataRows = [], minmax) {
        super(stack, { layout: Layout.VERTICAL, cornerRadius: 10, spacing: 2, });
        this.widgetSize = widgetSize;
        this.elementDepth = 0;
        this.addAreas(dataRows, incidenceTrend, minmax);
    }
    addAreas(dataRows, incidenceTrend, minmax) {
        dataRows.forEach(dataRow => this.addArea(dataRow, incidenceTrend, minmax));
    }
    addArea(dataRow, incidenceTrend, minmax) {
        const data = dataRow.data;
        const status = dataRow.status;
        const padding = CustomListWidget.isSmall(this.widgetSize) ? [4, 4, 4, 4] : [2, 4, 2, 4];
        const childDepth = this.elementDepth + 1;
        if (DataResponse.isSuccess(status) && data !== undefined) {
            new AreaRowStack(this.addStack(), this.widgetSize, data, incidenceTrend, status, dataRow.name, minmax, padding, 10, childDepth);
        }
        else {
            console.warn('Area can not be displayed. status: ' + status);
            new AreaErrorRowStack(this.addStack(), this.widgetSize, status, undefined, padding, 10, childDepth);
        }
    }
    addMultiArea(areaRows, state, incidenceTrend, minmax) {
        new MultiAreaRowStack(this.addStack(), this.widgetSize, this.elementDepth + 1, areaRows, state, incidenceTrend, minmax);
    }
    addMultiAreas(multiRows, incidenceTrend, minmax) {
        multiRows.forEach(row => this.addMultiArea(row.areaRows, row.state, incidenceTrend, minmax));
    }
}
class StatesRowStack extends ListStack {
    constructor(stack, widgetSize, spacing, states = [], incidenceTrend, minmax) {
        super(stack, widgetSize, Layout.HORIZONTAL, spacing, 2);
        this.items = [];
        this.stateBackgroundColor = Colors.BACKGROUND2;
        this.addItems(states, incidenceTrend, minmax);
    }
    createItem(data, incidenceTrend, minmax) {
        if (CustomListWidget.isSmall(this.widgetSize)) {
            return new SmallIncidenceBlockStack(this.addStack({ bgColor: Colors.BACKGROUND2 }), data, incidenceTrend, minmax);
        }
        else {
            return new SmallIncidenceRowStack(this.addStack({ bgColor: Colors.BACKGROUND2 }), data, incidenceTrend, minmax);
        }
    }
    addState(data, incidenceTrend, IncidenceTrend, minmax) {
        this.addItem(data, undefined, incidenceTrend, minmax);
    }
    addStates(data, incidenceTrend, minmax) {
        this.addItems(data, incidenceTrend, minmax);
    }
}
class StateListStack extends ListStack {
    constructor(stack, widgetSize, states, incidenceTrend, minmax) {
        super(stack, widgetSize, Layout.VERTICAL, 4);
        this.statesPerRow = 2;
        this.addStates(states, incidenceTrend, minmax);
    }
    addState(data, incidenceTrend, minmax) {
        for (const stateRowStack of this.items) {
            if (stateRowStack.length >= this.statesPerRow) {
                continue;
            }
            stateRowStack.addState(data, incidenceTrend, minmax);
            return;
        }
        this.addItem([data], undefined, incidenceTrend, minmax);
    }
    addStates(data, incidenceTrend, minmax) {
        for (const datum of data) {
            this.addState(datum, incidenceTrend, minmax);
        }
    }
    createItem(data, incidenceTrend, minmax) {
        return new StatesRowStack(this.addStack(), this.widgetSize, -1, data, incidenceTrend, minmax);
    }
}
class IncidenceListWidget extends CustomListWidget {
    constructor(api, parameters, family, coords = [], cfg) {
        super(parameters, family);
        this.api = api;
        this.locations = [...CustomLocation.fromWidgetParameters(this.parameters), ...coords];
        this.config = cfg;
        if (!this.family)
            this.setSizeByParameterCount(this.locations.length);
        this.backgroundColor = Colors.BACKGROUND;
        if (this.isSmall()) {
            this.setPadding(4, 4, 4, 4);
        }
        else {
            this.setPadding(6, 6, 6, 6);
        }
        const maxShown = this.isLarge() ? 6 : this.isMedium() ? 2 : 1;
        this.header = this.addTopBar();
        this.addSpacer(5);
        this.areaListStack = this.addAreaRowsStack();
        this.addSpacer();
        this.stateList = this.addStateRowsStack();
    }
    async setup() {
        this.incidenceTrend = this.config.graphShowIndex === "incidence" ? IncidenceTrend.DAY : IncidenceTrend.WEEK;
    }
    async fillWidget() {
        this.header.setTypeText(CFG.def.graphShowIndex);
        const [respGer] = await Promise.all([IncidenceData.loadCountry(this.api, 'GER', this.config.showVaccine)]);
        if (respGer.succeeded() && !respGer.isEmpty()) {
            const dataGer = IncidenceData.calcIncidence(respGer.data, this.config.incidenceDisableLive);
            this.setCountry(dataGer);
        }
        // AREAS
        let currentLocation;
        const areaRows = [];
        const areaIds = [];
        const graphMinMax = { min: { incidence: 0, cases: 0 }, max: { incidence: 0, cases: 0 } };
        for (const location of this.locations) {
            const respArea = await IncidenceData.loadArea(this.api, location);
            const status = respArea.status;
            if (!respArea.succeeded() || respArea.isEmpty()) {
                console.warn('fillWidget: Loading Area failed. Status: ' + status);
                if (location.type === LocationType.CURRENT) {
                    currentLocation = { status, name: location.name };
                }
                else {
                    areaRows.push({ status, name: location.name });
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
                    }
                    else if (!graphMinMax.max[maxKey]) {
                        graphMinMax.max[maxKey] = maxValues[maxKey];
                    }
                    else if (maxValues[maxKey] > graphMinMax.max[maxKey]) {
                        graphMinMax.max[maxKey] = maxValues[maxKey];
                    }
                }
            }
            if (location.type === LocationType.CURRENT) {
                currentLocation = { status, data: areaWithIncidence, name: location.name };
            }
            else {
                areaIds.push(areaId);
                areaRows.push({
                    status,
                    data: areaWithIncidence,
                    name: location.name,
                });
            }
        }
        const areaRowsFiltered = areaRows.filter(elem => elem.data?.meta.RS !== currentLocation?.data?.meta.RS);
        if (currentLocation) {
            areaRowsFiltered.unshift(currentLocation);
        }
        console.log('IncidenceListWidget.fillWidget: MaxValues: ' + JSON.stringify(graphMinMax));
        if (this.isSmall()) {
            const { status: dataStatus, data } = areaRowsFiltered[0];
            this.setStatus(dataStatus, data?.location);
        }
        // STATES
        const processed = {};
        const states = [];
        for (const row of areaRowsFiltered.filter(row => row.data !== undefined)) {
            if (row.data === undefined) {
                continue;
            }
            const meta = row.data.meta;
            const id = meta.BL_ID;
            if (processed[id])
                continue; // skip duplicated areaRows
            const resp = await IncidenceData.loadState(this.api, id, meta.BL, meta.EWZ_BL, this.config.showVaccine);
            if (!resp.isEmpty() && resp.succeeded()) {
                states.push(IncidenceData.calcIncidence(resp.data, this.config.incidenceDisableLive));
                processed[id] = true;
            }
            else {
                console.warn(`Loading state failed. status: ${resp.status}`);
            }
        }
        if (this.isLarge() && this.config.alternateLarge) {
            const multiRows = Helper.aggregateToMultiRows(areaRowsFiltered, states, 8);
            this.areaListStack.addMultiAreas(multiRows, this.incidenceTrend, graphMinMax);
        }
        else if (this.isLarge() && !this.config.alternateLarge) {
            this.addAreas(areaRowsFiltered.slice(0, 6), graphMinMax);
            this.addStates(states);
        }
        else {
            this.addAreas(areaRowsFiltered, graphMinMax);
            const shownStates = states;
            if (this.isSmall() && respGer.succeeded() && !respGer.isEmpty())
                shownStates.push(respGer.data);
            this.addStates(shownStates);
        }
        // UI ===
        if (this.config.openUrlOnTap)
            this.url = this.config.openUrl;
        this.refreshAfterDate = new Date(Date.now() + this.config.refreshInterval * 1000);
    }
    addTopBar() {
        return new HeaderStack(this.addStack(), this.size, '🦠');
    }
    addAreaRowsStack() {
        return new AreaListStack(this.addStack(), this.size, this.incidenceTrend);
    }
    addStateRowsStack() {
        return new StateListStack(this.addStack(), this.size, [], this.incidenceTrend);
    }
    setStatus(dataStatus, location) {
        this.header.setStatus(dataStatus, location);
    }
    addArea(status, data, name, minmax) {
        this.areaListStack.addArea({ status, data, name }, this.incidenceTrend, minmax);
    }
    addAreas(dataRows, minmax, showVaccine = false) {
        this.areaListStack.addAreas(dataRows, this.incidenceTrend, minmax);
    }
    addStates(states, minmax) {
        this.stateList.addStates(states, this.incidenceTrend, minmax);
    }
    setCountry(country) {
        this.header.setRValue(country.meta.r.r);
        this.header.setDateText(country.getDay()?.date);
        if (!this.isSmall())
            this.header.setCountryData(country, this.incidenceTrend);
    }
}
class UI {
    static generateGraph(data, size, minmax = {}, valueIndex = 'cases', colorIndex = 'incidence', align = Align.LEFT, upsideDown = CFG.def.graphUpsideDown) {
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
        }
        else if (align === Align.RIGHT) {
            xOffset = width - (showLen * (w + spacing) - spacing);
        }
        else if (align === Align.LEFT) {
            xOffset = 0;
        }
        else {
            // Align.LEFT as default
            xOffset = 0;
        }
        for (let i = 0; i + iOffset < data.length; i++) {
            const item = data[i + iOffset];
            let value = parseFloat(item[valueIndex].toString()); // Todo: i don't think we need to convert from number to string to number
            if (value === -1 && i === 0)
                value = 10;
            const h = Math.max(minH, (Math.abs(value) / max) * height);
            const x = xOffset + (w + spacing) * i;
            const y = (!upsideDown) ? height - h : 0;
            const rect = new Rect(x, y, w, h);
            context.setFillColor(UI.getIncidenceColor((item[valueIndex] >= 1) ? item[colorIndex] : 0));
            context.fillRect(rect);
        }
        return context;
    }
    static setColorOfElementByIndex(element, index, color) {
        if (typeof element[index] === 'undefined') {
            console.warn(`${element} has no attribute ${index}.`);
            return;
        }
        if (color instanceof Color) {
            element[index] = color;
        }
        else {
            const colorObj = Parse.color(color);
            if (colorObj != null) {
                element[index] = colorObj;
            }
        }
    }
    static getTrendUpArrow(now, prev) {
        if (now < 0 && prev < 0) {
            now = Math.abs(now);
            prev = Math.abs(prev);
        }
        if (now < prev) {
            return TrendArrow.UP_RIGHT;
        }
        else if (now > prev) {
            return TrendArrow.UP;
        }
        else {
            return TrendArrow.RIGHT;
        }
    }
    static getTrendArrow(value1, value2) {
        if (value1 < value2) {
            return TrendArrow.DOWN;
        }
        else if (value1 > value2) {
            return TrendArrow.UP;
        }
        else {
            return TrendArrow.RIGHT;
        }
    }
    static getIncidenceColor(incidence) {
        if (!incidence)
            return Colors.GRAY;
        for (const value of Object.values(Incidence).sort((a, b) => {
            return b.limit - a.limit;
        })) {
            if (incidence >= value.limit) {
                return value.color;
            }
        }
        return Colors.GRAY;
    }
    static getTrendArrowColor(arrow) {
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
    static getAreaIcon(areaIBZ) {
        const _type = ENV.areaIBZ.get(areaIBZ);
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
    static getStatusIconAndText(status) {
        let icon;
        let text;
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
                icon = '❗';
                text = 'error';
                break;
            default:
                icon = '';
                text = '';
        }
        return [icon, text];
    }
    static getLocStatusIconAndText(status, type) {
        let icon;
        let text;
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
    static getLocTypeIconAndText(type) {
        let icon;
        let text;
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
        return [icon, text];
    }
    static elementDepth2BgColor(depth) {
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
class CustomData {
    constructor(id, data, meta, fm = cfm) {
        this.id = id;
        this.meta = meta;
        this.data = data;
        this.fm = fm;
    }
    static fromResponse(response) {
        throw new Error(`'fromResponse' must be implemented.`);
    }
    getMaxFromDataObjectByIndex(index) {
        return CustomData.getMaxFromArrayOfObjectsByKey(this.data, index);
    }
    static getMaxFromArrayOfObjectsByKey(data, index) {
        return Math.max(...data.map(value => typeof value[index] === "number" ? value[index] : 0));
    }
    get storageFileName() {
        return `${(this.fm?.filestub ?? '') + this.id}.json`;
    }
    async save() {
        this.fm?.write(this.getStorageObject(), this.storageFileName, FileType.JSON);
    }
}
class IncidenceData extends CustomData {
    constructor(id, data, meta, location) {
        super(id, data, meta);
        this.location = location;
    }
    getDay(offset = 0) {
        return this.data[this.data.length - 1 - offset];
    }
    getAvg(weekOffset = 0, ignoreToday = false) {
        const caseData = this.data.reverse();
        const skipToday = ignoreToday ? 1 : 0;
        const offsetDays = 7;
        const weekData = caseData.slice(offsetDays * weekOffset + skipToday, offsetDays * weekOffset + 7 + skipToday);
        return weekData.reduce((acc, x) => acc + (x.incidence ?? 0), 0) / offsetDays;
    }
    getMaxCases() {
        return this.getMaxFromDataObjectByIndex('cases');
    }
    getMaxIncidence() {
        return this.getMaxFromDataObjectByIndex('incidence');
    }
    getMax() {
        return this.data.reduce((p, c) => {
            const { cases, incidence } = c;
            const { cases: pC, incidence: pI } = p;
            return {
                cases: !pC || (cases && cases > pC) ? cases : pC,
                incidence: !pI || (incidence && incidence > pI) ? incidence : pI
            };
        }, {});
    }
    getStorageObject() {
        return { id: this.id, data: this.data, meta: this.meta };
    }
    isArea() {
        return IncidenceData.isArea(this);
    }
    isState() {
        return IncidenceData.isState(this);
    }
    isCountry() {
        return IncidenceData.isCountry(this);
    }
    static fromResponse(response, location) {
        const data = response.data;
        return new IncidenceData(data.id, data.data, data.meta, location ?? data.location);
    }
    static fromObject(data, location) {
        return new IncidenceData(data.id, data.data, data.meta, location ?? data.location);
    }
    static isIncidenceValue(value) {
        return value.date !== undefined && value.date instanceof Date && !isNaN(value.date.getTime());
    }
    static isIncidenceValueArray(array) {
        for (const arrayElement of array) {
            if (!IncidenceData.isIncidenceValue(arrayElement)) {
                return false;
            }
        }
        return true;
    }
    static async loadFromCache(id, typeCheckMeta, ...params) {
        const resp = await cfm.read(cfm.filestub + id, FileType.JSON_DICT);
        if (resp.status !== DataStatus.OK || resp.isEmpty()) {
            return resp;
        }
        const { id: idLoaded, data, meta } = resp.data;
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
        const incidenceData = new IncidenceData(idLoaded, data.map(elem => {
            return { ...elem, date: new Date(elem.date) };
        }), meta, ...params);
        return DataResponse.ok(incidenceData);
    }
    static async loadAreaFromCache(loc) {
        const respId = await CustomLocation.idFromCache(loc);
        if (respId.status !== DataStatus.OK || respId.isEmpty()) {
            return DataResponse.error('Obtaining id from cache failed.');
        }
        const id = respId.data;
        return await IncidenceData.loadFromCache(id, IncidenceData.isMetaArea, loc);
    }
    static async loadStateFromCache(id) {
        return IncidenceData.loadFromCache(id, IncidenceData.isMetaState);
    }
    static async loadCountryFromCache(id) {
        return IncidenceData.loadFromCache(id, IncidenceData.isMetaCountry);
    }
    static completeHistory(data, offset = CFG.def.maxShownDays + 7, last) {
        if (!Array.isArray(data)) {
            throw Error('completeHistory: data is not an array');
        }
        data = data.sort((a, b) => a.date.getTime() - b.date.getTime());
        const lastDate = new Date(last ?? data[data.length - 1].date);
        //console.log(`completeHistory: lastDate: ${lastDate}`);
        const firstDate = new Date(new Date(lastDate).setDate(lastDate.getDate() - Math.abs(offset)));
        //console.log(`completeHistory: firstDate: ${firstDate}`);
        const completed = [];
        const currentDate = new Date(firstDate);
        let i = 0;
        while (currentDate <= lastDate) {
            if (i < data.length) {
                const value = data[i];
                if (currentDate.getDate() > new Date(value.date).getDate()) {
                    console.log(`completeHistory: skipp old value. date: ${currentDate} > value.date ${new Date(value.date)}`);
                    i++;
                    continue;
                }
                if (new Date(value.date).getDate() === currentDate.getDate()) {
                    //console.log(`completeHistory: use values from data. i: ${i}, date: ${currentDate}`)
                    completed.push({ ...value, date: new Date(currentDate) });
                    i++;
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                else {
                    console.log(`completeHistory: fill missing value. i: ${i} date: ${currentDate}, value.date: ${new Date(value.date)}`);
                    completed.push({ date: currentDate });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            else {
                console.log(`completeHistory: fill missing value, no data left. i: ${i}, date: ${currentDate}`);
                completed.push({ date: new Date(currentDate) });
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        return completed;
    }
    static calcIncidence(dataObject, disableLive = CFG.def.incidenceDisableLive) {
        const reversedData = dataObject.data.reverse();
        for (let i = 0; i < CFG.def.maxShownDays; i++) {
            const theDays = reversedData.slice(i + 1, i + 1 + 7); // without today
            const sumCasesLast7Days = theDays.reduce((a, b) => a + (b.cases ?? 0), 0);
            reversedData[i].incidence = (sumCasesLast7Days / dataObject.meta.EWZ) * 100000;
        }
        const meta = dataObject.meta;
        if (disableLive && meta.cases7_per_100k) {
            console.log('calcIncidence: using meta.cases7_per_100k');
            reversedData[0].incidence = meta.cases7_per_100k;
        }
        else {
            console.log('calcIncidence: using calculated incidence');
        }
        dataObject.data = reversedData.reverse();
        return dataObject;
    }
    static async loadVaccine(api, name) {
        const cached = ENV.cacheVaccines.get(name ?? 'GER');
        if (cached !== undefined) {
            return new DataResponse(cached);
        }
        const data = await api.vaccineData();
        if (!data) {
            return DataResponse.error();
        }
        const { lastUpdate } = data;
        if (lastUpdate === undefined) {
            console.warn(`loadVaccine: 'lastUpdate' is not defined.`);
        }
        const matches = data.data.filter(elem => elem.name === (name ?? 'Deutschland'));
        if (matches.length !== 1) {
            return DataResponse.error(`loadVaccine: Multiple matches or no match for '${name ?? 'Deutschland'}'. (${matches.length})`);
        }
        const vaccine = matches[0];
        if (!vaccine) {
            return DataResponse.notFound(`loadVaccine: Name not found in vaccine data. (${name})`);
        }
        if (!RkiService.isApiVaccineData(vaccine)) {
            return DataResponse.error('loadVaccine: Obtained data is no VaccineData');
        }
        const { fullyVaccinated, vaccinatedAtLeastOnce } = vaccine;
        const vaccineData = {
            lastUpdate,
            name: vaccine.name,
            fullyVaccinated,
            vaccinatedAtLeastOnce,
        };
        ENV.cacheVaccines.set(name ?? 'GER', vaccineData);
        return new DataResponse(vaccineData);
    }
    static async loadCountry(api, code, loadVaccine = false, cacheMaxAge = CFG.def.cacheMaxAge) {
        const cached = ENV.cacheCountries.get(code);
        if (cached !== undefined) {
            return new DataResponse(cached);
        }
        const logPre = `country ${code}`;
        // GER DATA
        const { cachedData, cachedAge } = await IncidenceData.loadCached(code, IncidenceData.loadCountryFromCache);
        if (cachedData && cachedAge && cachedAge < cacheMaxAge * 3600) {
            console.log(`${logPre}: using cached data`);
            if (!RkiService.isApiVaccineData(cachedData.meta.vaccine)) {
                cachedData.meta.vaccine = undefined;
            }
            return DataResponse.ok(cachedData);
        }
        else {
            console.log(`${logPre}: cache lifetime exceeded`);
        }
        const cases = await api.casesGer();
        if (typeof cases === 'boolean') {
            return DataResponse.error();
        }
        let vaccine;
        if (loadVaccine) {
            const resVac = await IncidenceData.loadVaccine(api);
            if (!resVac.succeeded() || resVac.isEmpty()) {
                console.warn('Loading vaccine data failed');
                vaccine = undefined;
            }
            else {
                vaccine = resVac.data;
            }
        }
        const meta = {
            name: 'Deutschland',
            short: 'GER',
            r: await api.rData(),
            EWZ: 83166711,
            vaccine: vaccine
        };
        const data = new IncidenceData(code, cases, meta);
        await data.save();
        ENV.cacheCountries.set(code, data);
        return new DataResponse(data);
    }
    static async loadArea(api, loc, cacheMaxAge = CFG.def.cacheMaxAge) {
        const location = await CustomLocation.getLocation(loc);
        if (location.status === LocationStatus.FAILED) {
            console.log(`Getting location failed (${loc.latitude},${loc.longitude}). Trying to load from cache...`);
            const resp = await IncidenceData.loadAreaFromCache(location);
            if (resp.succeeded() && !resp.isEmpty()) {
                return DataResponse.cached(resp.data);
            }
            else {
                return DataResponse.error('Loading from cache failed.');
            }
        }
        // load data from cache. If its fresh enough we return it
        const { cachedData, cachedAge } = await IncidenceData.loadCached(location, IncidenceData.loadAreaFromCache);
        if (cachedData && cachedAge && cachedAge < cacheMaxAge * 1000) {
            console.log('Using cached data');
            return DataResponse.ok(cachedData);
        }
        else {
            console.log('Cache lifetime exceeded, trying to update data...');
        }
        // get information for area
        const info = await api.locationData(location);
        if (!info) {
            const msg = `Getting meta data failed (${loc.latitude} ${loc.longitude})`;
            if (cachedData) {
                console.log(`${msg}, using cached data`);
                return DataResponse.cached(cachedData);
            }
            else {
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
            }
            else {
                return DataResponse.error(msg);
            }
        }
        const meta = {
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
        };
        await CustomLocation.geoCache(location, id);
        const data = new IncidenceData(id, cases, meta, location);
        await data.save();
        return new DataResponse(data);
    }
    static async loadState(api, id, name, ewz, loadVaccine = false, cacheMaxAge = CFG.def.cacheMaxAge) {
        const applicationCached = ENV.cacheStates.get(id);
        if (typeof applicationCached !== 'undefined') {
            return new DataResponse(applicationCached);
        }
        const logPre = `state ${id}`;
        const { cachedData, cachedAge } = await this.loadCached(id, IncidenceData.loadStateFromCache);
        if (cachedData && cachedAge && cachedAge < cacheMaxAge * 1000) {
            if (!RkiService.isApiVaccineData(cachedData.meta.vaccine)) {
                cachedData.meta.vaccine = undefined;
            }
            console.log(`${logPre}: using cached data`);
            return new DataResponse(cachedData);
        }
        else {
            console.log(`${logPre}: cache lifetime exceeded, trying to update data...`);
        }
        const cases = await api.casesState(id);
        if (typeof cases === 'boolean') {
            const msg = `${logPre}: Getting state failed`;
            console.log(`${msg}, using cached data`);
            if (cachedData) {
                return DataResponse.cached(cachedData);
            }
            else {
                return DataResponse.error(msg);
            }
        }
        name = ENV.states.get(id)?.name ?? name;
        let vaccine = undefined;
        if (loadVaccine) {
            const respVac = await IncidenceData.loadVaccine(api, name);
            if (respVac.succeeded() && !respVac.isEmpty()) {
                vaccine = respVac.data;
            }
            else {
                console.warn(`${logPre}: loading vaccine data failed.`);
            }
        }
        const short = ENV.states.get(id)?.short ?? id;
        const meta = {
            BL_ID: id,
            BL: name,
            EWZ: ewz,
            name: name,
            short: short,
            vaccine: vaccine,
        };
        const data = new IncidenceData(id, cases, meta);
        await data.save();
        ENV.cacheStates.set(id, data);
        return new DataResponse(data);
    }
    static async loadCached(param, fn) {
        const cached = await fn(param);
        let cachedData;
        let cachedAge;
        if (!cached.isEmpty() && cached.status === DataStatus.OK) {
            cachedData = cached.data;
            const lastModified = cfm.modificationDate(cachedData.storageFileName);
            cachedAge = Date.now() - (lastModified ?? new Date()).getTime();
        }
        else {
            console.warn(`Loading from cache failed. empty: ${cached.isEmpty()}, status: ${cached.status}, msg: ${cached.msg}`);
        }
        return { cachedData, cachedAge };
    }
    static isState(data) {
        return IncidenceData.isMetaState(data.meta);
    }
    static isCountry(data) {
        return IncidenceData.isMetaCountry(data.meta);
    }
    static isArea(data) {
        return IncidenceData.isMetaArea(data.meta);
    }
    static isVaccinatedData(data, fn) {
        if (data === undefined) {
            console.warn(`isVaccinatedData: data is not defined`);
            return false;
        }
        if (typeof data !== 'object' || data === null) {
            console.warn(`isVaccinatedData: data not an object or null. (${typeof data}, ${data}).`);
            return false;
        }
        const keysNumber = ['doses', 'quote', 'differenceToThePreviousDay'];
        if (!Helper.keysAreDefined(data, keysNumber, 'VaccinatedData')) {
            console.warn(`isVaccinatedData: required key is missing.`);
            return false;
        }
        const vaccine = data['vaccine'];
        if (!Array.isArray(vaccine)) {
            console.warn(`isVaccinatedData: data.vaccine not an array`);
            return false;
        }
        return vaccine.reduce((acc, elem) => acc && fn(elem));
    }
    static isVaccineData(data) {
        if (data === undefined) {
            console.warn(`isVaccineData: data is not defined.`);
            return false;
        }
        if (typeof data !== 'object' || data === null) {
            console.warn(`isVaccineData: data not an object or null. (${typeof data}, ${data}).`);
            return false;
        }
        const keys = ['name', 'vaccinatedAtLeastOnce', 'fullyVaccinated'];
        if (!Helper.keysAreDefined(data, keys, 'ApiVaccineData')) {
            console.warn(`isVaccineData: required key is missing.`);
            return false;
        }
        if (!IncidenceData.isVaccinatedData(data['vaccinatedAtLeastOnce'], RkiService.isApiVaccinatedAtLeastOnce)) {
            console.warn(`isVaccineData: data.vaccinatedAtLeastOnce not of type 'VaccinatedAtLeastOnce'`);
            return false;
        }
        if (!IncidenceData.isVaccinatedData(data['fullyVaccinated'], RkiService.isApiVaccineFullyVaccinated)) {
            console.warn(`isVaccineData: data.fullyVaccinated not of type 'VaccinatedAtLeastOnce'`);
            return false;
        }
        return true;
    }
    static isMetaState(meta) {
        const keys = ['BL_ID', 'BL', 'name'];
        const keysNumber = ['EWZ'];
        if (!Helper.keysNumberAreDefined(meta, keysNumber)) {
            console.warn(`isMetaState: meta not of type 'MetaState'.`);
            return false;
        }
        if (meta['vaccine'] !== undefined && !IncidenceData.isVaccineData(meta['vaccine'])) {
            console.warn(`isMetaState: meta.vaccine not of type 'VaccineData'.`);
            return false;
        }
        return Helper.keysAreDefined(meta, keys, 'MetaState');
    }
    static isMetaCountry(meta) {
        const keys = ['r'];
        const keysNumber = ['EWZ'];
        if (!Helper.keysNumberAreDefined(meta, keysNumber)) {
            console.warn(`isMetaCountry: meta not of type 'MetaCountry'.`);
            return false;
        }
        if (meta['vaccine'] !== undefined && !IncidenceData.isVaccineData(meta['vaccine'])) {
            console.warn(`isMetaCountry: meta.vaccine not of type 'VaccineData'.`);
            return false;
        }
        // todo check type of r
        return Helper.keysAreDefined(meta, keys, 'MetaCountry');
    }
    static isMetaArea(meta) {
        const keys = ['name', 'RS', 'last_update', 'BL', 'BL_ID'];
        const keysNumber = ['EWZ', 'IBZ', 'cases', 'cases_per_100k', 'EWZ_BL', 'cases7_bl_per_100k'];
        const keysNumberOptional = ['cases7_per_100k'];
        if (!Helper.keysNumberAreDefined(meta, keysNumber, keysNumberOptional)) {
            console.warn(`isMetaArea: meta not of type 'MetaArea'.`);
            return false;
        }
        return Helper.keysAreDefined(meta, keys, 'MetaArea');
    }
    static isStoredIncidenceValue(value) {
        const { date, cases, incidence } = value;
        for (const x of [cases, incidence]) {
            if (x !== undefined && isNaN(x)) {
                return false;
            }
        }
        return !isNaN(new Date(date).getTime());
    }
    static isStoredIncidenceValueArray(array) {
        for (let i = 0; i < array.length; i++) {
            const arrayElement = array[i];
            if (!IncidenceData.isStoredIncidenceValue(arrayElement)) {
                console.warn(`Element at ${i} not of type 'StoredIncidenceValue'.`);
                return false;
            }
        }
        return true;
    }
}
class MultiAreaRow {
    constructor(state, areaRows = []) {
        this.state = state;
        this.areas = new Map();
        for (const row of areaRows) {
            this.addAreaRow(row);
        }
    }
    get length() {
        return (this.currentLocation ? 1 : 0) + this.areas.size + 1;
    }
    isCurrentLocation() {
        return this.currentLocation !== undefined;
    }
    addAreaRow(areaRow) {
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
        const { id: areaId } = data;
        if (this.areas.has(areaId) || this.currentId === areaId) {
            console.log('Area has already been added. To update an area use updateAreaRow.');
            return;
        }
        const location = data.location;
        if (location?.type === LocationType.CURRENT) {
            this.currentLocation = areaRow;
            this.currentId = areaId;
        }
        else {
            this.areas.set(areaId, areaRow);
        }
    }
    getAreaRows() {
        return this.currentLocation ? [this.currentLocation, ...this.areas.values()] : Array.from(this.areas.values());
    }
    getState() {
        return this.state;
    }
}
class MultiAreaRows {
    constructor(max) {
        this.mapStates = new Map();
        this.max = max;
    }
    get length() {
        return (this.currentLocation?.length ?? 0) + Array.from(this.mapStates.values()).reduce((p, c) => p + c.length, 0);
    }
    addState(state) {
        const stateId = state.meta.BL_ID;
        if (this.mapStates.has(stateId)) {
            console.log(`State with id ${stateId} has already been added.`);
        }
        else {
            this.mapStates.set(stateId, new MultiAreaRow(state));
        }
    }
    addAreaRow(areaRow) {
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
    getMultiRows() {
        const values = this.currentLocation ? [this.currentLocation, ...this.mapStates.values()] : [...this.mapStates.values()];
        return values.map(value => {
            return { areaRows: value.getAreaRows(), state: value.getState() };
        });
    }
}
var LocationStatus;
(function (LocationStatus) {
    LocationStatus["OK"] = "loc_ok";
    LocationStatus["CACHED"] = "loc_cached";
    LocationStatus["FAILED"] = "loc_failed";
})(LocationStatus || (LocationStatus = {}));
var LocationType;
(function (LocationType) {
    LocationType["CURRENT"] = "loc_current";
    LocationType["STATIC"] = "loc_static";
})(LocationType || (LocationType = {}));
class CustomLocation {
    static async current() {
        try {
            Location.setAccuracyToThreeKilometers();
            const _coords = await Location.current();
            _coords.status = LocationStatus.OK;
            return _coords;
        }
        catch (e) {
            console.warn(e);
            return null;
        }
    }
    static async getLocation({ latitude, longitude, name, type }) {
        if (latitude >= 0 && longitude >= 0) {
            return { latitude, longitude, name, type, status: LocationStatus.OK };
        }
        let _loc = await CustomLocation.current();
        if (_loc === null) {
            _loc = await CustomLocation.currentFromCache();
            if (_loc === null) {
                return { latitude, longitude, name, type, status: LocationStatus.FAILED };
            }
        }
        _loc.name = name;
        _loc.type = type;
        return _loc;
    }
    static fromWidgetParameters(str) {
        const _staticCoords = str.split(';').map(coords => coords.split(','));
        const _current = () => {
            return { latitude: -1, longitude: -1, type: LocationType.CURRENT, name: undefined };
        };
        const _coords = [];
        for (const coords of _staticCoords) {
            if (coords.length === 0) {
                console.warn('To few arguments, expected at least one.');
                continue;
            }
            else if (coords.length > 4) {
                console.warn(`To many arguments for a location (expected up to 4): '${coords.join(',')}'`);
            }
            const index = parseInt(coords[0]);
            let latitude;
            let longitude;
            let name;
            let type;
            if (coords.length <= 2) {
                latitude = -1;
                longitude = -1;
                name = coords[1] ?? undefined;
                type = LocationType.CURRENT;
            }
            else {
                latitude = parseFloat(coords[1] ?? '-1');
                longitude = parseFloat(coords[2] ?? '-1');
                name = coords[3] ?? undefined;
                type = LocationType.STATIC;
            }
            _coords[index] = { index, location: { latitude, longitude, type, name } };
        }
        if (_coords.length === 0) {
            return [_current()];
        }
        const _locations = [];
        for (let i = 0; i < _coords[_coords.length - 1].index + 1; i++) {
            const coord = _coords[i];
            if (coord !== undefined) {
                for (let j = i; j < coord.index; j++) {
                    _locations.push(_current());
                    console.log('Filled missing location.');
                }
                _locations.push(coord.location);
            }
            else {
                _locations.push(_current());
                console.log('Filled empty location.');
            }
        }
        return _locations;
    }
    static async geoCache({ latitude, longitude, type }, id) {
        const lat = latitude.toFixed(CFG.geoCacheAccuracy);
        const lon = longitude.toFixed(CFG.geoCacheAccuracy);
        const key = lat + ',' + lon;
        const resp = await cfm.read(`${cfm.filestub}_geo`, FileType.JSON_DICT);
        let data;
        if (resp.status === DataStatus.NOT_FOUND) {
            console.log('GeoCache does not exist. File will be created...');
            data = {};
        }
        else if (!resp.isEmpty() && resp.status === DataStatus.OK) {
            data = resp.data;
        }
        else {
            return;
        }
        const current = data[key];
        if (current !== undefined && current !== id) {
            console.warn(`Cached value for '${key}' at accuracy ${CFG.geoCacheAccuracy} differs from new value. (${current} !== ${id})`);
        }
        if (type === LocationType.CURRENT)
            data['gps'] = key;
        data[key] = id;
        await cfm.write(data, `${cfm.filestub}_geo`, FileType.JSON);
    }
    static async idFromCache({ latitude, longitude, type }) {
        const resp = await cfm.read(`${cfm.filestub}_geo`, FileType.JSON_DICT);
        if (resp.status !== DataStatus.OK || resp.isEmpty()) {
            console.log('Error loading geoCache file.');
            return DataResponse.error();
        }
        const data = resp.data;
        let _key;
        if (type === LocationType.CURRENT) {
            _key = data['gps'];
            if (_key === undefined) {
                console.log('No key for current location.');
                return DataResponse.notFound();
            }
        }
        else {
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
    static async currentFromCache() {
        const resp = await cfm.read('/coronaWidget_geo', FileType.JSON_DICT);
        if (resp.status !== DataStatus.OK || resp.isEmpty()) {
            console.log('Error loading geoCache file.');
            return null;
        }
        const data = resp.data;
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
        return { latitude, longitude, type: LocationType.CURRENT, status: LocationStatus.CACHED };
    }
}
class DataResponse {
    constructor(data, status = DataStatus.OK, msg) {
        this.data = data;
        this.status = status;
        if (msg)
            this.msg = msg;
    }
    succeeded() {
        return DataResponse.isSuccess(this.status);
    }
    /**
     * Checks if the `DataResponse` is Empty.
     * If the field `data` is `null` or `undefined` the object is an instance of `EmptyResponse`.
     * Otherwise its an instance of `DataResponse`
     */
    isEmpty() {
        return DataResponse.isEmpty(this);
    }
    static fromDataResponse(resp, status) {
        return new DataResponse(resp.data, status, resp.msg);
    }
    static empty(status = DataStatus.OK, msg) {
        if (msg)
            console.warn(msg);
        return new DataResponse(null, status, msg);
    }
    static isSuccess(status) {
        return status === DataStatus.OK || status === DataStatus.CACHED;
    }
    static ok(data, msg) {
        return new DataResponse(data, DataStatus.OK, msg);
    }
    static error(msg) {
        return DataResponse.empty(DataStatus.ERROR, msg);
    }
    static apiError(msg) {
        return DataResponse.empty(DataStatus.API_ERROR, msg);
    }
    static notFound(msg) {
        return DataResponse.empty(DataStatus.NOT_FOUND, msg);
    }
    static cached(data) {
        if (data instanceof DataResponse) {
            return DataResponse.fromDataResponse(data, DataStatus.CACHED);
        }
        return new DataResponse(data, DataStatus.CACHED);
    }
    /**
     * Checks if the `DataResponse` is Empty.
     * If the field `data` is `null` or `undefined` the object is an instance of `EmptyResponse`.
     * Otherwise its an instance of `DataResponse`
     */
    static isEmpty(resp) {
        return resp.data == null;
    }
}
var FileType;
(function (FileType) {
    FileType["TEXT"] = "txt";
    FileType["JSON"] = "json";
    FileType["JSON_DICT"] = "json_dict";
    FileType["OTHER"] = "";
    FileType["LOG"] = "log";
})(FileType || (FileType = {}));
const FileExtensions = {
    [FileType.TEXT]: 'txt',
    [FileType.JSON]: 'json',
    [FileType.JSON_DICT]: 'json',
    [FileType.LOG]: 'log',
    [FileType.OTHER]: '',
};
class CustomFileManager {
    constructor(configDir, filestub) {
        try {
            this.fm = FileManager.iCloud();
            this.fm.documentsDirectory();
        }
        catch (e) {
            console.warn(e);
            this.fm = FileManager.local();
        }
        this.configDir = configDir;
        this.scriptableDir = this.fm.documentsDirectory();
        this.configPath = this.fm.joinPath(this.fm.documentsDirectory(), this.configDir);
        this.filestub = filestub;
        if (!this.fm.isDirectory(this.configPath))
            this.fm.createDirectory(this.configPath);
    }
    getAbsolutePath(relFilePath, configDir = true) {
        return this.fm.joinPath(configDir ? this.configPath : this.scriptableDir, relFilePath);
    }
    fileExists(filePath, configDir = true) {
        return this.fm.fileExists(this.getAbsolutePath(filePath, configDir));
    }
    copy(from, to, configDir = true) {
        const pathFrom = this.getAbsolutePath(from, configDir);
        const pathTo = this.getAbsolutePath(to, configDir);
        this.fm.copy(pathFrom, pathTo);
    }
    async read(file, type = FileType.TEXT, configDir = true) {
        const ext = CustomFileManager.extensionByType(type);
        const path = this.getAbsolutePath(file.endsWith(ext) ? file : file + ext, configDir);
        if (this.fm.isFileStoredIniCloud(path) && !this.fm.isFileDownloaded(path)) {
            await this.fm.downloadFileFromiCloud(path);
        }
        if (this.fm.fileExists(path)) {
            try {
                const resStr = this.fm.readString(path);
                if (type === FileType.JSON) {
                    return new DataResponse(JSON.parse(resStr));
                }
                else if (type === FileType.JSON_DICT) {
                    const dict = JSON.parse(resStr);
                    if (typeof dict !== 'object' || Array.isArray(dict) || dict === null) {
                        console.warn('read: parsed data not a dictionary.');
                        return DataResponse.error();
                    }
                    else {
                        return new DataResponse(dict);
                    }
                }
                else {
                    return new DataResponse(resStr);
                }
            }
            catch (e) {
                console.error(e);
                return DataResponse.error();
            }
        }
        else {
            console.warn(`File ${path} does not exist.`);
            return DataResponse.notFound();
        }
    }
    write(data, file = this.filestub, type = FileType.TEXT, configDir = true) {
        let dataStr;
        if (type === FileType.JSON || type === FileType.JSON_DICT) {
            dataStr = JSON.stringify(data);
        }
        else if (type === FileType.TEXT) {
            dataStr = data;
        }
        else {
            dataStr = data;
        }
        const ext = CustomFileManager.extensionByType(type);
        const path = this.getAbsolutePath(file.endsWith(ext) ? file : file + ext, configDir);
        this.fm.writeString(path, dataStr);
    }
    remove(filePath, baseDir = true) {
        this.fm.remove(this.getAbsolutePath(filePath, baseDir));
    }
    modificationDate(filePath, baseDir = true) {
        return this.fm.modificationDate(this.getAbsolutePath(filePath, baseDir));
    }
    listContents(filePath, configDir = true) {
        return this.fm.listContents(this.getAbsolutePath(filePath, configDir));
    }
    static extensionByType(type, omitDot = false) {
        const dot = omitDot ? '' : '.';
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
    static typeByExtension(extension) {
        switch (extension) {
            case 'txt':
                return FileType.TEXT;
            case 'json':
                return FileType.JSON;
            case 'log':
                return FileType.LOG;
            default:
                throw new Error(`Unknown extension ${extension}.`);
        }
    }
}
class Format {
    static dateStr(timestamp, time = false) {
        const _date = new Date(timestamp);
        let str = `${_date.getDate().toString().padStart(2, '0')}` +
            `.${(_date.getMonth() + 1).toString().padStart(2, '0')}` +
            `.${_date.getFullYear()}`;
        if (time) {
            str += ' ' + Format.timeStr(_date);
        }
        return str;
    }
    static timeStr(timestamp) {
        const _date = new Date(timestamp);
        const _hours = _date.getHours().toString();
        const _minutes = _date.getMinutes().toString();
        return `${_hours.padStart(2, '0')}:${_minutes.padStart(2, '0')}`;
    }
    static number(number, fractionDigits = 0, limit) {
        if (limit && number >= limit)
            fractionDigits = 0;
        return Number(number).toLocaleString(undefined, {
            maximumFractionDigits: fractionDigits,
            minimumFractionDigits: fractionDigits,
        });
    }
    static rValue(data) {
        const parsedData = Parse.rCSV(data, ',');
        const res = { date: null, r: 0 };
        if (parsedData.length === 0)
            return res;
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
    static rCSV(rDataStr, separator = ',') {
        const lines = rDataStr.split(/(?:\r\n|\n)+/).filter(el => el.length !== 0);
        const headers = lines[0].split(separator);
        const elements = [];
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
    static color(color) {
        let hex, alpha;
        if (/^#[\da-f]{3,4}$/i.test(color)) {
            hex = Array.from(color.slice(1, 4)).reduce((acc, b) => {
                return acc + b + b;
            }, '#');
            const char = color.charAt(4);
            alpha = char.length === 1 ? parseInt(char + char, 16) / 255 : 1;
        }
        else if (/^#(?:[\da-f]{2}){3,4}$/i.test(color)) {
            hex = color.slice(0, 7);
            const str = color.slice(7, 9);
            alpha = str.length === 2 ? parseInt(str, 16) / 255 : 1;
        }
        else {
            console.warn(`'${color}' is not a valid colorString.'`);
            return null;
        }
        return new Color(hex, alpha);
    }
}
class Helper {
    static getDateBefore(offset, startDate = new Date()) {
        const offsetDate = new Date();
        offsetDate.setDate(startDate.getDate() - offset);
        return offsetDate.toISOString().split('T').shift();
    }
    static keysAreDefined(object, keys, name, log = true) {
        if (typeof object !== 'object' || object === null) {
            if (log)
                console.warn(`keysAreDefined: object is not an object or null. (${typeof object}, ${object})`);
            return false;
        }
        for (const key of keys) {
            if (object[key] === undefined) {
                if (log)
                    console.warn(`keysAreDefined: Object is not of type '${name}'. Key '${key}' is missing.`);
                return false;
            }
        }
        return true;
    }
    static keysNumberAreDefined(object, keys, keysOptional = [], log = true) {
        if (typeof object !== 'object' || object === null) {
            if (log)
                console.warn(`keysNumberAreDefined: object is not an object or null. (${typeof object}, ${object})`);
            return false;
        }
        for (const keyOptional of keysOptional) {
            if (object[keyOptional] !== undefined) {
                keys.push(keyOptional);
            }
        }
        for (const key of keys) {
            const value = object[key];
            if (value === undefined) {
                if (log)
                    console.warn(`keysNumberAreDefined: required key '${key}' is not defined!`);
                return false;
            }
            if (!Number.isFinite(value)) {
                if (log)
                    console.warn(`keysNumberAreDefined: key '${key}' is not a number. (${typeof value}, ${value})!`);
                return false;
            }
        }
        return true;
    }
    static aggregateToMultiRows(areaRows, states, maxLength = 0) {
        const multiRows = new MultiAreaRows(maxLength);
        for (const state of states) {
            multiRows.addState(state);
        }
        for (const areaRow of areaRows) {
            multiRows.addAreaRow(areaRow);
        }
        return multiRows.getMultiRows();
    }
    static mergeConfig(target, source, skipKeys = []) {
        for (const key in source) {
            if (skipKeys.includes(key)) {
                console.log('skipping key ' + key);
                continue;
            }
            if (typeof target[key] === "object") {
                if (key in target) {
                    target[key] = { ...target[key], ...source[key] };
                }
                else {
                    target[key] = source[key];
                }
            }
            else {
                target[key] = source[key];
            }
        }
    }
    static async migrateConfig(path = 'config.json', target) {
        function helper(src, target, keys) {
            if (!src)
                return target;
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
        const old = resp.data;
        let migrated = {
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
        }
        else {
            const resp = await cfm.read(path_default, FileType.JSON_DICT);
            if (resp.status === DataStatus.OK && !resp.isEmpty()) {
                // Todo check format of loaded config
                const cfg_default = resp.data;
                Helper.mergeConfig(CFG, cfg_default);
            }
            else {
                console.warn('error reading defaults');
            }
        }
        if (!cfm.fileExists(path)) {
            console.log('no user config found');
        }
        else {
            const resp = await cfm.read(path, FileType.JSON);
            if (resp.status === DataStatus.OK && !resp.isEmpty()) {
                // Todo check format of loaded config
                console.log('Config loaded successfully.');
                const cfg = resp.data;
                Helper.mergeConfig(CFG, cfg);
            }
            else {
                console.warn('error reading config');
            }
        }
    }
    static async getLatestConfig() {
        const req = new Request(HTTP_CONFIG);
        req.timeoutInterval = 10;
        let data;
        try {
            data = await req.loadString();
        }
        catch (e) {
            console.log('getLatestConfig: request failed');
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
        const { autoUpdateInterval, autoUpdate } = CFG;
        if (!autoUpdate) {
            console.log('updateScript: skip (disabled)');
            return;
        }
        console.log('updateScript: start updated');
        let _data = {};
        if (cfm.fileExists('.data.json', true)) {
            const res = await cfm.read('.data', FileType.JSON, true);
            if (res.status === DataStatus.OK && !res.isEmpty()) {
                if (typeof res.data !== 'object' || Array.isArray(res.data) || res.data === null) {
                    console.warn('updateScript: _data is not a dictionary');
                    _data = {};
                }
                else {
                    _data = res.data;
                }
            }
            else {
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
        }
        catch (e) {
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
            if (cfm.fileExists(backupFile, false))
                await cfm.remove(backupFile, false);
            cfm.copy(currentFile, backupFile, false);
            cfm.write(script, currentFile, FileType.OTHER, false);
            cfm.remove(backupFile, false);
            _data['lastUpdated'] = _data['lastCheck'] = currentDate;
            cfm.write(_data, '.data.json', FileType.JSON, true); // .data.json is stored in configDir
            console.log('updateScript: script updated');
        }
        catch (e) {
            console.warn(e);
            console.warn('updateScript: update failed, rolling back...');
            if (cfm.fileExists(backupFile, false)) {
                cfm.copy(backupFile, currentFile, false);
                cfm.remove(backupFile, false);
            }
        }
    }
    static checkLatest(current, version) {
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
var RequestType;
(function (RequestType) {
    RequestType["JSON"] = "json";
    RequestType["STRING"] = "string";
})(RequestType || (RequestType = {}));
class RkiService /*implements RkiServiceInterface*/ {
    constructor() {
        this.cache = new Map();
    }
    static async execJson(url) {
        const req = new Request(url);
        req.timeoutInterval = 20;
        let data;
        try {
            data = await req.loadJSON();
        }
        catch (e) {
            console.warn(`RkiService.execJson: ${url}`);
            console.warn(e);
            return DataResponse.error('Error requesting data.');
        }
        const response = req.response;
        if (response.statusCode !== undefined && response.statusCode === 200) {
            return new DataResponse(data);
        }
        else if (response.statusCode !== undefined && response.statusCode === 404) {
            return DataResponse.notFound('Request returned: 404 NOT FOUND');
        }
        else {
            return DataResponse.error(`Unexpected status. (${response.statusCode}).`);
        }
    }
    static async execString(url) {
        const req = new Request(url);
        req.timeoutInterval = 20;
        let data;
        try {
            data = await req.loadString();
        }
        catch (e) {
            console.warn(e);
            return DataResponse.error('Error requesting data.');
        }
        return data.length > 0 ? new DataResponse(data) : DataResponse.notFound();
    }
    async exec(url, type = RequestType.JSON) {
        try {
            if (type === RequestType.JSON) {
                return RkiService.execJson(url);
            }
            else if (type === RequestType.STRING) {
                return RkiService.execString(url);
            }
            else {
                return DataResponse.error(`Request of type '${RequestType}' are not supported.`);
            }
        }
        catch (e) {
            console.warn(`RKIService.exec: ${url}, ${type}`);
            console.warn(e);
            return DataResponse.error(`Request failed. (${url})`);
        }
    }
    async execCached(url, type = RequestType.JSON) {
        const cacheKey = type + '_' + url;
        const cached = this.cache.get(cacheKey);
        let res;
        if (typeof cached === 'undefined') {
            res = await this.exec(url, type);
            if (res.status === DataStatus.OK) {
                this.cache.set(cacheKey, res);
            }
        }
        else {
            res = cached;
        }
        return res;
    }
    async casesArea(id) {
        const apiStartDate = Helper.getDateBefore(CFG.def.maxShownDays + 7);
        const urlToday = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1,-1)%20AND%20IdLandkreis%3D${id}&objectIds&time&resultType=standard&outFields&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields&groupByFieldsForStatistics&outStatistics=%5B%7B%22statisticType%22:%22sum%22,%22onStatisticField%22:%22AnzahlFall%22,%22outStatisticFieldName%22:%22cases%22%7D,%20%7B%22statisticType%22:%22max%22,%22onStatisticField%22:%22MeldeDatum%22,%22outStatisticFieldName%22:%22date%22%7D%5D&having&resultOffset&resultRecordCount&sqlFormat=none&token`;
        const urlHistory = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=NeuerFall+IN%281%2C0%29+AND+IdLandkreis=${id}+AND+MeldeDatum+%3E%3D+TIMESTAMP+%27${apiStartDate}%27&objectIds=&time=&resultType=standard&outFields=AnzahlFall%2CMeldeDatum&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=MeldeDatum&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22cases%22%7D%5D%0D%0A&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token=`;
        const hist = await this.getCases(urlToday, urlHistory);
        return typeof hist === 'boolean' ? hist : IncidenceData.completeHistory(hist, CFG.def.maxShownDays + 7, new Date().setHours(0, 0, 0, 0));
    }
    async casesGer() {
        const apiStartDate = Helper.getDateBefore(CFG.def.maxShownDays + 7);
        let urlToday = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1,-1)&returnGeometry=false&geometry=42.000,12.000&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22,%22onStatisticField%22%3A%22AnzahlFall%22,%22outStatisticFieldName%22%3A%22cases%22%7D%5D&resultType=standard&cacheHint=true`;
        urlToday += `&groupByFieldsForStatistics=MeldeDatum`;
        const urlHistory = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=NeuerFall+IN%281%2C0%29+AND+MeldeDatum+%3E%3D+TIMESTAMP+%27${apiStartDate}%27&objectIds=&time=&resultType=standard&outFields=AnzahlFall%2CMeldeDatum&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=MeldeDatum&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22cases%22%7D%5D%0D%0A&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token=`;
        const hist = await this.getCases(urlToday, urlHistory);
        return typeof hist === 'boolean' ? hist : IncidenceData.completeHistory(hist, CFG.def.maxShownDays + 7, new Date().setHours(0, 0, 0, 0));
    }
    async casesState(id) {
        const apiStartDate = Helper.getDateBefore(CFG.def.maxShownDays + 7);
        const urlToday = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1,%20-1)+AND+IdBundesland=${id}&objectIds=&time=&resultType=standard&outFields=&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22,%22onStatisticField%22%3A%22AnzahlFall%22,%22outStatisticFieldName%22%3A%22cases%22%7D%5D&having=&resultOffset=&resultRecordCount=&sqlFormat=none&token=`;
        const urlHistory = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=NeuerFall+IN%281%2C0%29+AND+IdBundesland=${id}+AND+MeldeDatum+%3E%3D+TIMESTAMP+%27${apiStartDate}%27&objectIds=&time=&resultType=standard&outFields=AnzahlFall%2CMeldeDatum&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=MeldeDatum&groupByFieldsForStatistics=MeldeDatum&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22cases%22%7D%5D%0D%0A&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token=`;
        const hist = await this.getCases(urlToday, urlHistory);
        return typeof hist === 'boolean' ? hist : IncidenceData.completeHistory(hist, CFG.def.maxShownDays + 7, new Date().setHours(0, 0, 0, 0));
    }
    async getCases(urlToday, urlHistory) {
        const keyCases = 'MeldeDatum';
        const resToday = await this.execCached(urlToday);
        const resHistory = await this.execCached(urlHistory);
        if (resToday.status !== DataStatus.OK || resHistory.status !== DataStatus.OK) {
            console.warn(`RKiService.getCases: requesting cases failed. (today: ${resToday.status} history: ${resHistory.status})`);
            return false;
        }
        let todayCases;
        let lastDateToday;
        let dataToday;
        if (resToday.status === DataStatus.OK && !resToday.isEmpty()) {
            const features = resToday.data.features ?? [];
            if (features.length > 0) {
                todayCases = features.reduce((a, b) => a + b.attributes.cases, 0);
                lastDateToday = Math.max(...resToday.data.features.map(a => a.attributes[keyCases]));
                if (isNaN(lastDateToday))
                    lastDateToday = new Date().setHours(0, 0, 0, 0);
                dataToday = {
                    cases: todayCases,
                    date: new Date(lastDateToday),
                };
            }
            else {
                console.warn(`Unexpected response format for resToday. \nurl: ${urlToday}\nreply:${JSON.stringify(resToday)})`);
            }
        }
        let dataHist = [];
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
                }
                else {
                    lastDate = lastDateToday; // lastDateToday is defined and the latest date
                }
                dataToday = {
                    cases: todayCases,
                    date: new Date(lastDate),
                };
            }
            else {
                console.warn(`Unexpected response format for resHistory. \nurl: ${urlHistory}\nreply:${JSON.stringify(resHistory)})`);
            }
        }
        const data = dataToday !== undefined ? [...dataHist, dataToday] : dataHist;
        data.sort((a, b) => a.date.getTime() - b.date.getTime());
        return data;
    }
    async locationData({ latitude, longitude }) {
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
        }
        else {
            console.warn(`Obtained data is no 'ApiMetaArea'. (${lat},${lon})`);
            return false;
        }
    }
    async vaccineData() {
        const url = `https://rki-vaccination-data.vercel.app/api/v2`;
        const response = await this.execCached(url, RequestType.JSON);
        if (response.status === DataStatus.OK && !response.isEmpty()) {
            const { lastUpdate, data: vaccineData } = response.data;
            if (lastUpdate === undefined) {
                console.warn(`vaccineData: Unexpected response, 'lastUpdate' is not defined!`);
            }
            if (vaccineData === undefined) {
                console.warn(`vaccineData: Unexpected response, 'data' is not defined!`);
                console.log(response.data);
                return false;
            }
            if (!Array.isArray(vaccineData)) {
                console.warn(`vaccineData: Unexpected response, 'data' is no array!`);
                console.log(vaccineData);
                console.log(response.data);
                return false;
            }
            return { lastUpdate, data: vaccineData };
        }
        else {
            console.warn(`Unexpected response format. \nurl: ${url}\nreply:${JSON.stringify(response.data)})`);
            return false;
        }
    }
    async rData() {
        const url = `https://raw.githubusercontent.com/robert-koch-institut/SARS-CoV-2-Nowcasting_und_-R-Schaetzung/main/Nowcast_R_aktuell.csv`;
        const response = await this.execCached(url, RequestType.STRING);
        if (response.status === DataStatus.OK && !response.isEmpty()) {
            return Format.rValue(response.data);
        }
        else {
            return { date: null, r: 0 };
        }
    }
    static isApiMetaArea(meta) {
        const keysNumber = ['IBZ', 'cases', 'cases_per_100k', 'EWZ', 'EWZ_BL', 'cases7_bl_per_100k'];
        const keysNumberOptional = ['cases7_per_100k'];
        const keys = ['BL', 'BL_ID', 'GEN', 'last_update', 'RS'];
        if (!Helper.keysAreDefined(meta, keys, 'ApiMetaArea')) {
            console.warn(`isApiMetaArea: data is not of type 'ApiMetaArea', required key does not exist.`);
            return false;
        }
        if (!Helper.keysNumberAreDefined(meta, keysNumber, keysNumberOptional)) {
            console.warn(`isApiMetaArea: data is not of type 'ApiMetaArea', required key does not exist or is of wrong type.`);
            return false;
        }
        return true;
    }
    static isApiVaccinatedAtLeastOnce(data) {
        if (typeof data !== "object" || data === null) {
            console.warn(`isApiVaccinatedAtLeastOnce: data is not an object or null. (${typeof data}, ${data})`);
            return false;
        }
        const name = data['name'];
        if (!["biontech", "moderna", "astrazeneca", "janssen"].includes(name)) {
            console.warn(`isApiVaccinatedAtLeastOnce: data not of type 'ApiVaccinatedAtLeastOnce', wrong value for 'name'. (${name})`);
            return false;
        }
        const doses = data['doses'];
        if (doses === undefined || !Number.isFinite(doses)) {
            console.warn(`isApiVaccinatedAtLeastOnce: data not of type 'ApiVaccinatedAtLeastOnce', wrong value for 'doses'. (${doses})`);
            return false;
        }
        return true;
    }
    static isApiVaccineFullyVaccinated(data) {
        if (typeof data !== "object" || data === null) {
            console.warn(`isApiVaccineFullyVaccinated: data not an object or null. (${typeof data}, ${data})`);
            return false;
        }
        const name = data['name'];
        if (!["biontech", "moderna", "astrazeneca", "janssen"].includes(name)) {
            console.warn(`isApiVaccineFullyVaccinated: data not of type 'ApiVaccineFullyVaccinated', wrong value for 'name'. (${name})`);
            return false;
        }
        const keysNumber = ['firstDoses', 'totalDoses'];
        if (!Helper.keysAreDefined(data, keysNumber, 'ApiVaccineFullyVaccinated')) {
            return false;
        }
        const keysNumberOptional = ['secondDoses'];
        for (const key of keysNumberOptional) {
            if (data[key] !== undefined) {
                keysNumber.push(key);
            }
        }
        for (const key of keysNumber) {
            if (!Number.isFinite(data[key])) {
                console.warn(`isApiVaccineFullyVaccinated: data not of type 'ApiVaccineFullyVaccinated', value for '${key}' is NaN. (${data[key]})`);
                return false;
            }
        }
        return true;
    }
    static isApiVaccineData(data) {
        if (data === undefined) {
            console.warn(`isApiVaccineData: data not of type 'ApiVaccineData', data is undefined.`);
            return false;
        }
        if (typeof data !== 'object' || data === null) {
            console.warn(`isApiVaccineData: data not an object or null. (${typeof data}, ${data})`);
            return false;
        }
        const keys = ['name', 'inhabitants', 'isState', 'rs', 'vaccinatedAtLeastOnce', 'fullyVaccinated'];
        if (!Helper.keysAreDefined(data, keys, 'ApiVaccineData')) {
            return false;
        }
        if (!RkiService.isApiVaccinatedData(data['vaccinatedAtLeastOnce'], RkiService.isApiVaccinatedAtLeastOnce)) {
            console.warn(`isApiVaccineData: data not of type 'ApiVaccineData', 'data.vaccinatedAtLeastOnce' is not of type 'ApiVaccinatedAtLeastOnce'`);
            return false;
        }
        if (!RkiService.isApiVaccinatedData(data['fullyVaccinated'], RkiService.isApiVaccineFullyVaccinated)) {
            console.warn(`isApiVaccineData: data not of type 'ApiVaccineData', 'data.fullyVaccinated' is not of type 'ApiVaccineFullyVaccinated'`);
            return false;
        }
        return true;
    }
    static isApiVaccinatedData(data, fn) {
        if (typeof data !== 'object' || data === null) {
            console.warn(`isApiVaccinated: data is not an object or null. (${typeof data}, ${data})`);
            return false;
        }
        const keysNumber = ['doses', 'quote', 'differenceToThePreviousDay'];
        const keys = [...keysNumber, 'vaccine'];
        if (!Helper.keysAreDefined(data, keys, 'ApiVaccinated')) {
            return false;
        }
        for (const keyNumber of keysNumber) {
            if (!Number.isFinite(data[keyNumber])) {
                console.warn(`isApiVaccinated: 'data.${keyNumber}' is NaN. (${data[keyNumber]})`);
                return false;
            }
        }
        const vaccine = data['vaccine'];
        if (!Array.isArray(vaccine)) {
            console.warn(`isApiVaccinated: data not of type 'ApiVaccinated', 'data.vaccine' is not an array.`);
            return false;
        }
        return vaccine.reduce((acc, elem) => acc && fn(elem));
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
//# sourceMappingURL=incidence.js.map