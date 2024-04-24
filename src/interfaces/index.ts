export type ResponseError = { message: string };

export interface ProofAnswer {
    address: string,
    amount: bigint,
    proof: string[],
    status:number,
    statusText:string,
}