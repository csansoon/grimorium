import {
  Icon as IconRootComponent,
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BeerIcon,
  BookMarkedIcon,
  BookUserIcon,
  BirdhouseIcon,
  BombIcon,
  CrownIcon,
  CheckIcon,
  CheckCircleIcon,
  ChefHatIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChurchIcon,
  CircleIcon,
  CircleDotIcon,
  CloudMoonIcon,
  ConciergeBellIcon,
  CrosshairIcon,
  DramaIcon,
  DiamondIcon,
  DicesIcon,
  EyeIcon,
  FingerprintPatternIcon,
  FishIcon,
  FlaskConicalIcon,
  FlameIcon,
  FlameKindlingIcon,
  FlowerIcon,
  Gamepad2Icon,
  GhostIcon,
  GlobeIcon,
  GripVerticalIcon,
  HandHeartIcon,
  HatGlassesIcon,
  HeartIcon,
  HistoryIcon,
  InfoIcon,
  LandmarkIcon,
  ListOrderedIcon,
  MenuIcon,
  MinusIcon,
  MoonIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  RoseIcon,
  ScaleIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  ShirtIcon,
  ShovelIcon,
  ShuffleIcon,
  SkullIcon,
  SmartphoneIcon,
  SparklesIcon,
  SquareIcon,
  SquareCheckIcon,
  StarIcon,
  SunIcon,
  SunriseIcon,
  SwordsIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
  TrendingUpDownIcon,
  TrophyIcon,
  UserIcon,
  UserPlusIcon,
  UserRoundIcon,
  UserXIcon,
  UsersIcon,
  VoteIcon,
  XIcon,
  ZapOffIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { candleHolderLit, flowerLotus, hatTop, starNorth } from '@lucide/lab'

const Icons = {
  alertTriangle: AlertTriangleIcon,
  arrowLeft: ArrowLeftIcon,
  arrowRight: ArrowRightIcon,
  beer: BeerIcon,
  birdHouse: BirdhouseIcon,
  bomb: BombIcon,
  bookMarked: BookMarkedIcon,
  bookUser: BookUserIcon,
  check: CheckIcon,
  crown: CrownIcon,
  checkCircle: CheckCircleIcon,
  checkSquare: SquareCheckIcon,
  chefHat: ChefHatIcon,
  chevronDown: ChevronDownIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronUp: ChevronUpIcon,
  church: ChurchIcon,
  circle: CircleIcon,
  circleDot: CircleDotIcon,
  cloudMoon: CloudMoonIcon,
  conciergeBell: ConciergeBellIcon,
  crosshair: CrosshairIcon,
  drama: DramaIcon,
  diamond: DiamondIcon,
  landmark: LandmarkIcon,
  listOrdered: ListOrderedIcon,
  menu: MenuIcon,
  dices: DicesIcon,
  eye: EyeIcon,
  fingerprint: FingerprintPatternIcon,
  fish: FishIcon,
  flask: FlaskConicalIcon,
  flame: FlameIcon,
  flameKindling: FlameKindlingIcon,
  flower: FlowerIcon,
  gamepad: Gamepad2Icon,
  ghost: GhostIcon,
  globe: GlobeIcon,
  gripVertical: GripVerticalIcon,
  handHeart: HandHeartIcon,
  hatGlasses: HatGlassesIcon,
  heart: HeartIcon,
  history: HistoryIcon,
  info: InfoIcon,
  minus: MinusIcon,
  moon: MoonIcon,
  pencil: PencilIcon,
  play: PlayIcon,
  plus: PlusIcon,
  rose: RoseIcon,
  scale: ScaleIcon,
  scrollText: ScrollTextIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  shield: ShieldIcon,
  shirt: ShirtIcon,
  shovel: ShovelIcon,
  shuffle: ShuffleIcon,
  skull: SkullIcon,
  smartphone: SmartphoneIcon,
  sparkles: SparklesIcon,
  square: SquareIcon,
  star: StarIcon,
  sun: SunIcon,
  sunrise: SunriseIcon,
  swords: SwordsIcon,
  thumbsDown: ThumbsDownIcon,
  thumbsUp: ThumbsUpIcon,
  trash: Trash2Icon,
  trendingUpDown: TrendingUpDownIcon,
  trophy: TrophyIcon,
  user: UserIcon,
  userPlus: UserPlusIcon,
  userRound: UserRoundIcon,
  userX: UserXIcon,
  users: UsersIcon,
  vote: VoteIcon,
  x: XIcon,
  zapOff: ZapOffIcon,
}

const LabIcons = {
  candleHolderLit,
  flowerLotus,
  starNorth,
  hatTop,
}

export type IconName = keyof typeof Icons | keyof typeof LabIcons

export type IconProps = {
  name: IconName
  size?: Size
  className?: string
  strokeWidth?: number
}

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'

const sizeClasses: Record<Size, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-12 h-12',
  '3xl': 'w-16 h-16',
  '4xl': 'w-20 h-20',
}

export function Icon({
  name,
  size = 'md',
  strokeWidth = 2,
  className,
}: IconProps) {
  if (name in LabIcons) {
    return (
      <IconRootComponent
        iconNode={LabIcons[name as keyof typeof LabIcons]}
        className={cn(sizeClasses[size], className)}
        strokeWidth={strokeWidth}
      />
    )
  }

  const IconComponent = Icons[name as keyof typeof Icons]
  return (
    <IconComponent
      className={cn(sizeClasses[size], className)}
      strokeWidth={strokeWidth}
    />
  )
}
