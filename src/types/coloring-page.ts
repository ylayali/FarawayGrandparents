export type ColoringPageType = 'straight-copy' | 'facial-portrait' | 'cartoon-portrait';

export type BackgroundType = 'plain' | 'mindful-pattern' | 'scene';

export type OrientationType = 'portrait' | 'landscape';

export type SetPieceType = 'none' | 'corner-peel';

export interface ColoringPageFormData {
    type: ColoringPageType;
    imageFiles: File[];
    background: BackgroundType;
    orientation: OrientationType;
    nameOrMessage: string;
    individualNames: string[];
    sceneDescription?: string;
    setPiece: SetPieceType;
    burstingInText?: string;
    burstingInFlags?: boolean[];
}

export interface ColoringPageApiData {
    mode: 'edit';
    prompt: string;
    imageFiles: File[];
    size: '1024x1536' | '1536x1024';
    quality: 'medium';
    n: 1;
}
