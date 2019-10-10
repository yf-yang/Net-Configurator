import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bandwidth'
})
export class BandwidthPipe implements PipeTransform {

  transform(value: number, args?: any): string {
    const units = ['', 'K', 'M', 'G', 'T'];
    let i = 2;

    if (value) {
      if (value < 1) {
        while (value < 1) {
          value *= 1000;
          i--;
        }
      } else if (value > 1) {
        while (value > 1) {
          value /= 1000;
          i++;
        }

        if (value < 1) {
          value *= 1000;
          i--;
        }
      }

      return value + units[i];
    } else if (value === 0) {
      return '0M';
    }

    return '';
  }

}
