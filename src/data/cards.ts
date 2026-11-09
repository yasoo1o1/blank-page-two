import imgZain from "@/assets/cards/types/zain.png";
import imgWorldElite from "@/assets/cards/types/world-elite.png";
import imgSignature from "@/assets/cards/types/signature.png";
import imgRoyalClub from "@/assets/cards/types/royal-club.png";
import imgTogether from "@/assets/cards/types/together.png";
import imgTravelMate from "@/assets/cards/types/travel-mate.png";
import imgUefa from "@/assets/cards/types/uefa.png";
import imgLaliga from "@/assets/cards/types/laliga.jpg";
import imgPlatinum from "@/assets/cards/types/platinum.png";
import imgGold from "@/assets/cards/types/gold.png";
import imgNashama from "@/assets/cards/types/nashama.png";
import imgShababCredit from "@/assets/cards/types/shabab-credit.png";
import imgLoyalty from "@/assets/cards/types/loyalty.png";
import imgAmex from "@/assets/cards/types/amex.png";
import imgVisaDebit from "@/assets/cards/types/visa-debit.png";
import imgShababDebit from "@/assets/cards/types/shabab-debit.png";
import imgInternetShopping from "@/assets/cards/types/internet-shopping.png";

export type CardItem = { id: string; title: string; tagline: string; img: string };

export const creditCards: CardItem[] = [
  { id: "visa-black", title: "بطاقة فيزا بلاك الائتمانية", tagline: "عالم من الامتيازات الحصرية بين يديك.", img: imgZain },
  { id: "world-elite", title: "بطاقة ورلد ايليت ماستر كارد الائتمانية من البنك العربي", tagline: "تجربة عالمية من الفخامة والمزايا الاستثنائية.", img: imgWorldElite },
  { id: "visa-signature", title: "بطاقة Visa Signature الائتمانية", tagline: "مزايا راقية صُممت لتناسب أسلوب حياتك.", img: imgSignature },
  { id: "royal-jordanian", title: "بطاقة فيزا البنك العربي والملكية الاردنية الائتمانية البلاتينية", tagline: "اكسب أميال السفر مع كل عملية شراء.", img: imgRoyalClub },
  { id: "maan-platinum", title: "بطاقة معــاً الائتمانية البلاتينية", tagline: "معاً نحو مزايا أكثر وحياة أسهل.", img: imgTogether },
  { id: "travel-mate", title: "بطاقة Travel Mate Visa الائتمانية من البنك العربي", tagline: "رفيقك المثالي في كل رحلة حول العالم.", img: imgTravelMate },
  { id: "uefa", title: "بطاقة UEFA بلاتنيوم الائتمانية", tagline: "لعشاق كرة القدم، مزايا بلاتينية بطابع رياضي.", img: imgUefa },
  { id: "laliga", title: "بطاقة فيزا لاليغا البنك العربي الائتمانية", tagline: "عش شغف الكرة الإسبانية مع مزايا حصرية.", img: imgLaliga },
  { id: "visa-platinum", title: "بطاقة فيزا بلاتنيوم الائتمانية", tagline: "مرونة مالية ومزايا بلاتينية تلائم تطلعاتك.", img: imgPlatinum },
  { id: "visa-gold", title: "بطاقة فيزا جولد الائتمانية", tagline: "بطاقة ذهبية بمزايا تناسب احتياجاتك اليومية.", img: imgGold },
  { id: "nashama", title: "بطاقة النشامى فيزا الائتمانية من البنك العربي", tagline: "ادعم منتخبك الوطني مع كل عملية شراء.", img: imgNashama },
  { id: "shabab-credit", title: "بطاقة فيزا شباب الائتمانية", tagline: "بطاقتك الأولى بخطوات سهلة ومزايا شبابية.", img: imgShababCredit },
  { id: "loyalty", title: "بطاقة فيزا نقاط العربي", tagline: "اجمع النقاط واستبدلها بما تحب.", img: imgLoyalty },
  { id: "amex", title: "بطاقة أمريكان إكسبريس الأئتمانية", tagline: "قوة شرائية عالمية ومزايا مميزة.", img: imgAmex },
];

export const debitCards: CardItem[] = [
  { id: "visa-debit", title: "بطاقات فيزا الدفع", tagline: "تحكم مباشر بأموالك أينما كنت.", img: imgVisaDebit },
  { id: "shabab-debit", title: "بطاقة فيزا شباب الدفع من البنك العربي", tagline: "بطاقة دفع عملية مصممة للشباب.", img: imgShababDebit },
];

export const prepaidCards: CardItem[] = [
  { id: "internet-shopping", title: "بطاقة التسوق عبر الإنترنت", tagline: "تسوّق عبر الإنترنت بأمان وحدود تتحكم بها.", img: imgInternetShopping },
];

export const cardGroups = [
  { label: "البطاقات الائتمانية", items: creditCards },
  { label: "بطاقات الدفع", items: debitCards },
  { label: "بطاقات التسوق عبر الإنترنت", items: prepaidCards },
];

export const allCards: CardItem[] = [...creditCards, ...debitCards, ...prepaidCards];

export function getCard(id: string) {
  return allCards.find((c) => c.id === id);
}
