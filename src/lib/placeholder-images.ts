import placeholderData from './placeholder-images.json';

type ImageType = keyof typeof placeholderData;
type ImageParams = {
    seed: string;
}

const typedPlaceholderData = placeholderData as Record<ImageType, { seed: string, width: number, height: number }>;

export function getImageUrl(
    type: ImageType, 
    params: ImageParams,
    realImageUrl?: string | null
): string {
    if (realImageUrl) {
        return realImageUrl;
    }
    
    const seedInfo = typedPlaceholderData[type];
    const seed = `${seedInfo.seed}_${params.seed}`;
    const width = seedInfo.width;
    const height = seedInfo.height;
    
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
