import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';

try {
  autocomplete( $('#address'), $('#lat'), $('#lng') );
} catch (e) {
  // TODO only load this when used
}

typeAhead( $('.search') );


makeMap( $('#map') );
