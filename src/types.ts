export type DocDataType = Promise<string> | undefined

export type DocType = {
    data: Promise<string> | Buffer | undefined,
    status: number,
    statusText: string
}


export type ArticalType = {
    id: string
    heading: string
    subTitle: string
    author: string
    date: string
    body: string[]
}
