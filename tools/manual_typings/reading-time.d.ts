declare module 'reading-time' {
    interface ReadingTime {
        text: string;
        minutes: number;
        words: number;
    }

    interface IReadingTime {
        (input: string) : ReadingTime;
    }

    const readingTime: IReadingTime;
    export = readingTime;
}