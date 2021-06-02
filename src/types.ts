export type DocDataType = Promise<string> | undefined

export type DocType = {
    data: Promise<string> | Buffer | undefined,
    status: number,
    statusText: string
}


export type ArticalType = {
    id: string
    _id?: string
    url: string
    heading: string
    subTitle: string
    author: string
    date: string
    images: string[]
    body: string[]
}

