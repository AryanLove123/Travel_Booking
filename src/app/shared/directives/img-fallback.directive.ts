import { Directive, ElementRef, HostListener, inject } from "@angular/core";

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c5efe5"/><stop offset="1" stop-color="#9fd3e6"/></linearGradient></defs>
      <rect width="900" height="600" fill="url(#g)"/>
      <path d="M0 470 L230 300 L400 400 L560 250 L900 470 V600 H0Z" fill="#ffffff" fill-opacity=".55"/>
      <circle cx="700" cy="150" r="48" fill="#ffffff" fill-opacity=".7"/></svg>`,
  );

@Directive({selector: 'img[appImgFallback]'})
export class ImgFallbackDirective{
    img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

    @HostListener('error')
    onError(): void{
        if(this.img.src !== PLACEHOLDER) this.img.src = PLACEHOLDER;
    }
}