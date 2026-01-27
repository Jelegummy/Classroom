export type CreateClassroom = {
    name: string,
    title?: string,
    code?: string,
}

export type UpdateClassroom = {
    id: string,
    name?: string,
    title?: string,
    hoverImage?: string,
}

export type Classroom = {
    id: string,
    name: string,
    title?: string,
    hoverImage?: string,
}