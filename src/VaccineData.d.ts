type VaccineDataAtLeastOnce = { name: "biontech" | "moderna" | "astrazeneca" | "janssen", doses: number }
type VaccineDataFully = { name: "biontech" | "moderna" | "astrazeneca" | "janssen", firstDoses: number, secondDoses?: number, totalDoses: number }

type VaccinatedData<T> = {
    doses: number,
    quote: number,
    differenceToThePreviousDay: number,
    vaccine?: T
}

type VaccineData = {
    name: string,
    lastUpdate?: string,
    vaccinatedAtLeastOnce: VaccinatedData<VaccineDataAtLeastOnce>,
    fullyVaccinated: VaccinatedData<VaccineDataFully>,
}