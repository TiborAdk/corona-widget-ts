type VaccineName = "biontech" | "moderna" | "astrazeneca" | "janssen" | "novavax";

type VaccineDataAtLeastOnce = { name: VaccineName, doses: number }
type VaccineDataFully = { name: VaccineName, firstDoses: number, secondDoses?: number, totalDoses: number }

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