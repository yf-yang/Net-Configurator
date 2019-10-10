import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textShorten'
})
export class TextShortenPipe implements PipeTransform {

  transform(value: string, length: number): any {
    return value.length <= length ? value : value.substring(0, length) + '...';
  }

}
