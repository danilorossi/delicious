import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';

try {
  autocomplete( $('#address'), $('#lat'), $('#lng') );
} catch (e) {
  // TODO only load this when used
}

typeAhead( $('.search') );
