import './style.css';
import { InternalReadout } from './ui/internal-readout';

const readout = new InternalReadout();
readout.update({
  tick: 0,
  oxygen: 80,
  power: 65,
  signedInAccount: 'none',
  colonyOwner: 'none',
});
