// Current pack's source bindings. Keep simulation consumers independent of source filenames.
import oldBirthdates from '../../verified-birthdates.json' with {type:'json'};
import researched from '../phase1/birthdates.json' with {type:'json'};
export const birthdates={...researched,...oldBirthdates};
export {default as ratings} from '../../curated-ratings.json' with {type:'json'};
