interface ApiVaccineFullyVaccinated {
    name: "biontech" | "moderna" | "astrazeneca" | "janssen",
    firstDoses: number,
    secondDoses?: number,
    totalDoses: number
}

interface ApiVaccinatedAtLeastOnce {
    name: "biontech" | "moderna" | "astrazeneca" | "janssen",
    doses: number,
}

interface ApiVaccinatedData<T> {
    doses: number,
    quote: number,
    differenceToThePreviousDay: number,
    vaccine: T
}

interface ApiVaccineData {
    name: string,
    inhabitants: number,
    isState: boolean,
    rs: string,
    vaccinatedAtLeastOnce: ApiVaccinatedData<ApiVaccinatedAtLeastOnce>,
    fullyVaccinated: ApiVaccinatedData<ApiVaccineFullyVaccinated>,
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

interface RkiServiceInterface {
    cache: Map<string, DataResponse<{ [p: string]: any } | string> | EmptyResponse>;

    locationData: ({longitude, latitude}: { latitude: number, longitude: number }) => Promise<any>;
    casesArea: (id: string) => Promise<false | IncidenceValue[]>;
    casesState: (id: string) => Promise<false | IncidenceValue[]>;
    casesGer: () => Promise<false | IncidenceValue[]>;
    rData: () => Promise<Rdata>;
    getCases: (urlToday: string, urlHistory: string) => Promise<false | IncidenceValue[]>;
    exec: (url: string, type: RequestType) => Promise<DataResponse<{ [p: string]: any } | string> | EmptyResponse>;
    execCached: (url: string, type: RequestType) => Promise<DataResponse<any>>;

}