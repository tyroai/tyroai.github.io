// Aramanın Denetim Merkezi komutlarının metinleri (Türkçe) yalnız aramanın parçasıyla iner;
// bkz. lib/i18nDictionaries. Aramanın öteki komutları (cmd.*) çekirdekte.
import { strings } from "@/data/strings.tr.cmd"
import { addTurkishPart } from "@/lib/i18nDictionaries"

addTurkishPart(strings)
