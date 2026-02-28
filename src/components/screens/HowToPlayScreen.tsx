import { useI18n } from '../../lib/i18n'
import { Icon, BackButton } from '../atoms'
import { RoleCard } from '../items/RoleCard'
import { MysticDivider } from '../items'

type Props = {
    onBack: () => void
}

/**
 * Simple parser to render **bold** text in translations.
 */
function parseBold(text: string) {
    const parts = text.split('**')
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <strong key={i} className='text-parchment-100 font-semibold'>
                {part}
            </strong>
        ) : (
            part
        ),
    )
}

export function HowToPlayScreen({ onBack }: Props) {
    const { t } = useI18n()
    const hp = t.howToPlay

    const scrollTo = (id: string) => {
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const toc = [
        { id: 'part1', label: hp.part1Title },
        { id: 'part2', label: hp.part2Title },
        { id: 'part3', label: hp.part3Title },
        { id: 'part4', label: hp.part4Title },
    ]

    return (
        <div className='min-h-app bg-grimoire-darker text-parchment-200 flex flex-col md:flex-row relative'>
            {/* Desktop ToC Sidebar */}
            <div className='hidden md:block w-64 shrink-0 border-r border-parchment-500/10 bg-black/20 p-6 sticky top-0 h-screen overflow-y-auto'>
                <div className='mb-8'>
                    <BackButton onClick={onBack} label={t.common.back} />
                </div>
                <h2 className='font-tarot text-xl text-mystic-gold uppercase tracking-widest mb-6'>
                    {hp.title}
                </h2>
                <nav className='space-y-4'>
                    {toc.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollTo(item.id)}
                            className='block text-left w-full text-sm text-parchment-400 hover:text-mystic-gold transition-colors font-medium'
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className='flex-1 max-w-3xl lg:max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 md:py-12 space-y-16'>
                {/* Mobile Header */}
                <div className='md:hidden flex items-center mb-8 sticky top-0 bg-grimoire-darker/95 backdrop-blur-md z-10 py-4 -mx-4 px-4 border-b border-parchment-500/10'>
                    <BackButton onClick={onBack} label={t.common.back} />
                    <h1 className='flex-1 text-center font-tarot text-xl text-mystic-gold uppercase tracking-widest mr-8'>
                        {hp.title}
                    </h1>
                </div>

                {/* ================================================================ */}
                {/* PART 1: GAME RULES */}
                {/* ================================================================ */}
                <section id='part1' className='scroll-mt-24 space-y-8'>
                    <h2 className='font-tarot text-3xl text-mystic-gold uppercase tracking-widest border-b border-mystic-gold/20 pb-4'>
                        {hp.part1Title}
                    </h2>

                    <div className='space-y-4'>
                        <h3 className='text-xl text-parchment-100 font-bold'>
                            {hp.p1_nutshellTitle}
                        </h3>
                        <ul className='list-disc pl-5 space-y-2 text-parchment-300'>
                            <li>{parseBold(hp.p1_nutshell1)}</li>
                            <li>{parseBold(hp.p1_nutshell2)}</li>
                            <li>{parseBold(hp.p1_nutshell3)}</li>
                            <li>{parseBold(hp.p1_nutshell4)}</li>
                            <li>{parseBold(hp.p1_nutshell5)}</li>
                        </ul>
                    </div>

                    <MysticDivider />

                    <div className='space-y-6'>
                        <h3 className='text-xl text-parchment-100 font-bold'>
                            {hp.p1_teamsTitle}
                        </h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                            {/* Townsfolk */}
                            <div className='bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center space-y-4 shadow-lg'>
                                <div className='space-y-3'>
                                    <h4 className='font-tarot text-2xl text-mystic-gold tracking-widest uppercase'>
                                        {t.teams.townsfolk.name}
                                    </h4>
                                    <p className='text-sm text-parchment-200 leading-relaxed max-w-sm'>
                                        {parseBold(hp.p1_teamTownsfolk)}
                                    </p>
                                </div>

                                <div className='w-full h-px bg-white/10 my-1' />

                                <div className='space-y-2 w-full flex flex-col items-center'>
                                    <p className='text-xs text-parchment-400 italic'>
                                        {parseBold(hp.p1_teamTownsfolkExample)}
                                    </p>
                                    <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                                        <RoleCard roleId='washerwoman' />
                                    </div>
                                </div>
                            </div>

                            {/* Outsider */}
                            <div className='bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center space-y-4 shadow-lg'>
                                <div className='space-y-3'>
                                    <h4 className='font-tarot text-2xl text-mystic-gold tracking-widest uppercase'>
                                        {t.teams.outsider.name}
                                    </h4>
                                    <p className='text-sm text-parchment-200 leading-relaxed max-w-sm'>
                                        {parseBold(hp.p1_teamOutsider)}
                                    </p>
                                </div>

                                <div className='w-full h-px bg-white/10 my-1' />

                                <div className='space-y-2 w-full flex flex-col items-center'>
                                    <p className='text-xs text-parchment-400 italic'>
                                        {parseBold(hp.p1_teamOutsiderExample)}
                                    </p>
                                    <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                                        <RoleCard roleId='drunk' />
                                    </div>
                                </div>
                            </div>

                            {/* Minion */}
                            <div className='bg-red-900/10 border border-red-500/20 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center space-y-4 shadow-lg'>
                                <div className='space-y-3'>
                                    <h4 className='font-tarot text-2xl text-red-400 tracking-widest uppercase'>
                                        {t.teams.minion.name}
                                    </h4>
                                    <p className='text-sm text-parchment-200 leading-relaxed max-w-sm'>
                                        {parseBold(hp.p1_teamMinion)}
                                    </p>
                                </div>

                                <div className='w-full h-px bg-red-500/10 my-1' />

                                <div className='space-y-2 w-full flex flex-col items-center'>
                                    <p className='text-xs text-red-300 italic'>
                                        {parseBold(hp.p1_teamMinionExample)}
                                    </p>
                                    <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                                        <RoleCard roleId='poisoner' />
                                    </div>
                                </div>
                            </div>

                            {/* Demon */}
                            <div className='bg-red-900/10 border border-red-500/20 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center space-y-4 shadow-lg'>
                                <div className='space-y-3'>
                                    <h4 className='font-tarot text-2xl text-red-400 tracking-widest uppercase'>
                                        {t.teams.demon.name}
                                    </h4>
                                    <p className='text-sm text-parchment-200 leading-relaxed max-w-sm'>
                                        {parseBold(hp.p1_teamDemon)}
                                    </p>
                                </div>

                                <div className='w-full h-px bg-red-500/10 my-1' />

                                <div className='space-y-2 w-full flex flex-col items-center'>
                                    <p className='text-xs text-red-300 italic'>
                                        {parseBold(hp.p1_teamDemonExample)}
                                    </p>
                                    <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                                        <RoleCard roleId='imp' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <MysticDivider />

                    <div className='space-y-4'>
                        <h3 className='text-xl text-parchment-100 font-bold'>
                            {hp.p1_roundTitle}
                        </h3>
                        <div className='bg-black/20 rounded-xl p-6 space-y-6'>
                            <div className='flex items-start gap-4'>
                                <div className='mt-1 bg-indigo-900/50 p-2 rounded-full'>
                                    <Icon name='moon' className='text-indigo-400' size='sm' />
                                </div>
                                <div>
                                    <h4 className='font-bold text-parchment-100 mb-1'>{hp.p1_roundNightLabel}</h4>
                                    <p className='text-sm text-parchment-300 leading-relaxed'>
                                        {hp.p1_roundNight}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='mt-1 bg-amber-900/50 p-2 rounded-full'>
                                    <Icon name='sun' className='text-mystic-gold' size='sm' />
                                </div>
                                <div>
                                    <h4 className='font-bold text-parchment-100 mb-1'>{hp.p1_roundDayLabel}</h4>
                                    <p className='text-sm text-parchment-300 leading-relaxed'>
                                        {hp.p1_roundDay}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='mt-1 bg-emerald-900/50 p-2 rounded-full'>
                                    <Icon name='vote' className='text-emerald-400' size='sm' />
                                </div>
                                <div>
                                    <h4 className='font-bold text-parchment-100 mb-1'>
                                        {hp.p1_roundNominateLabel}
                                    </h4>
                                    <p className='text-sm text-parchment-300 leading-relaxed'>
                                        {hp.p1_roundNominate}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='bg-white/5 border border-white/10 rounded-xl p-5'>
                            <h4 className='font-bold text-parchment-100 mb-2 uppercase text-xs tracking-wider'>
                                {hp.p1_roundWinConditions}
                            </h4>
                            <ul className='space-y-2 text-sm text-parchment-300'>
                                <li className='flex items-start gap-2'>
                                    <span className='text-blue-400'>•</span>
                                    <span>{parseBold(hp.p1_roundWinGood)}</span>
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className='text-red-400'>•</span>
                                    <span>{parseBold(hp.p1_roundWinEvil)}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <MysticDivider />

                    <div className='space-y-4'>
                        <h3 className='text-xl text-parchment-100 font-bold'>
                            {hp.p1_conceptsTitle}
                        </h3>
                        <ul className='list-disc pl-5 space-y-3 text-sm leading-relaxed text-parchment-300'>
                            <li>{parseBold(hp.p1_conceptPoison)}</li>
                            <li>{parseBold(hp.p1_conceptDrunk)}</li>
                            <li>{parseBold(hp.p1_conceptDead)}</li>
                            <li>{parseBold(hp.p1_conceptStoryteller)}</li>
                        </ul>
                    </div>
                </section>

                {/* ================================================================ */}
                {/* PART 2: APP WALKTHROUGH */}
                {/* ================================================================ */}
                <section id='part2' className='scroll-mt-24 space-y-8'>
                    <h2 className='font-tarot text-3xl text-mystic-gold uppercase tracking-widest border-b border-mystic-gold/20 pb-4'>
                        {hp.part2Title}
                    </h2>

                    <div className='space-y-8'>
                        {/* Create Game */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-3 text-mystic-gold'>
                                <Icon name='users' />
                                <h3 className='text-xl font-bold'>{hp.p2_createTitle}</h3>
                            </div>
                            <ul className='list-disc pl-11 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p2_create1)}</li>
                                <li>{parseBold(hp.p2_create2)}</li>
                                <li>{parseBold(hp.p2_create3)}</li>
                                <li>{parseBold(hp.p2_create4)}</li>
                            </ul>
                            <div className='ml-11 text-sm text-parchment-400/80 italic'>
                                💡 {hp.p2_createTip}
                            </div>
                        </div>

                        {/* Setup Actions */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-3 text-mystic-gold'>
                                <Icon name='settings' />
                                <h3 className='text-xl font-bold'>{hp.p2_setupTitle}</h3>
                            </div>
                            <ul className='list-disc pl-11 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p2_setup1)}</li>
                                <li>{parseBold(hp.p2_setup2)}</li>
                            </ul>
                        </div>

                        {/* Revelation */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-3 text-mystic-gold'>
                                <Icon name='eye' />
                                <h3 className='text-xl font-bold'>{hp.p2_revealTitle}</h3>
                            </div>
                            <ul className='list-disc pl-11 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p2_reveal1)}</li>
                                <li>{parseBold(hp.p2_reveal2)}</li>
                                <li>{parseBold(hp.p2_reveal3)}</li>
                            </ul>
                            <div className='ml-11 mt-3 bg-red-900/20 border border-red-500/30 p-3 rounded-lg text-sm text-red-200'>
                                ⚠️ {parseBold(hp.p2_revealWarning)}
                            </div>
                        </div>

                        {/* Night Component Visual */}
                        <MysticDivider />

                        {/* Night */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-3 text-indigo-400'>
                                <Icon name='moon' />
                                <h3 className='text-xl font-bold text-parchment-100'>
                                    {hp.p2_nightTitle}
                                </h3>
                            </div>
                            <ul className='list-disc pl-11 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p2_night1)}</li>
                                <li>{parseBold(hp.p2_night2)}</li>
                                <li>{parseBold(hp.p2_night3)}</li>
                                <li>{parseBold(hp.p2_night4)}</li>
                                <li>{parseBold(hp.p2_night5)}</li>
                            </ul>
                            <div className='ml-11 text-sm text-parchment-400/80 italic'>
                                💡 {parseBold(hp.p2_nightTip)}
                            </div>
                        </div>

                        {/* Day */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-3 text-amber-500'>
                                <Icon name='sun' />
                                <h3 className='text-xl font-bold text-parchment-100'>
                                    {hp.p2_dayTitle}
                                </h3>
                            </div>
                            <ul className='list-disc pl-11 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p2_day1)}</li>
                                <li>{parseBold(hp.p2_day2)}</li>
                                <li>{parseBold(hp.p2_day3)}</li>
                                <li>{parseBold(hp.p2_day4)}</li>
                            </ul>
                        </div>

                        {/* Voting */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-3 text-emerald-500'>
                                <Icon name='vote' />
                                <h3 className='text-xl font-bold text-parchment-100'>
                                    {hp.p2_voteTitle}
                                </h3>
                            </div>
                            <ul className='list-disc pl-11 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p2_vote1)}</li>
                                <li>{parseBold(hp.p2_vote2)}</li>
                                <li>{parseBold(hp.p2_vote3)}</li>
                                <li>{parseBold(hp.p2_vote4)}</li>
                            </ul>
                        </div>

                        {/* End */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-3 text-mystic-gold'>
                                <Icon name='trophy' />
                                <h3 className='text-xl font-bold'>{hp.p2_endTitle}</h3>
                            </div>
                            <ul className='list-disc pl-11 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p2_end1)}</li>
                                <li>{parseBold(hp.p2_end2)}</li>
                                <li className='text-blue-300'>{parseBold(hp.p2_end3)}</li>
                                <li className='text-red-300'>{parseBold(hp.p2_end4)}</li>
                                <li>{parseBold(hp.p2_end5)}</li>
                            </ul>
                        </div>

                        <MysticDivider />

                        {/* Grimoire & History */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                            <div className='bg-white/5 border border-white/10 rounded-xl p-5 space-y-3'>
                                <div className='flex items-center gap-2 text-mystic-gold'>
                                    <Icon name='bookMarked' size='sm' />
                                    <h4 className='font-bold'>{hp.p2_grimTitle}</h4>
                                </div>
                                <ul className='list-disc pl-5 space-y-2 text-sm text-parchment-300'>
                                    <li>{parseBold(hp.p2_grim1)}</li>
                                    <li>{parseBold(hp.p2_grim2)}</li>
                                    <li>{parseBold(hp.p2_grim3)}</li>
                                </ul>
                            </div>

                            <div className='bg-white/5 border border-white/10 rounded-xl p-5 space-y-3'>
                                <div className='flex items-center gap-2 text-mystic-gold'>
                                    <Icon name='history' size='sm' />
                                    <h4 className='font-bold'>{hp.p2_historyTitle}</h4>
                                </div>
                                <ul className='list-disc pl-5 space-y-2 text-sm text-parchment-300'>
                                    <li>{parseBold(hp.p2_history1)}</li>
                                    <li>{parseBold(hp.p2_history2)}</li>
                                    <li>{parseBold(hp.p2_history3)}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/* PART 3: TIPS FOR PLAYERS */}
                {/* ================================================================ */}
                <section id='part3' className='scroll-mt-24 space-y-8'>
                    <h2 className='font-tarot text-3xl text-mystic-gold uppercase tracking-widest border-b border-mystic-gold/20 pb-4'>
                        {hp.part3Title}
                    </h2>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                        <div className='bg-white/5 border border-white/10 p-5 rounded-xl'>
                            <h4 className='font-bold text-parchment-100 mb-2 flex items-center gap-2'>
                                <span className='text-mystic-gold'>1.</span>
                                {hp.p3_tip1Title}
                            </h4>
                            <p className='text-sm text-parchment-300 leading-relaxed'>
                                {parseBold(hp.p3_tip1Desc)}
                            </p>
                        </div>
                        <div className='bg-white/5 border border-white/10 p-5 rounded-xl'>
                            <h4 className='font-bold text-parchment-100 mb-2 flex items-center gap-2'>
                                <span className='text-mystic-gold'>2.</span>
                                {hp.p3_tip2Title}
                            </h4>
                            <p className='text-sm text-parchment-300 leading-relaxed'>
                                {parseBold(hp.p3_tip2Desc)}
                            </p>
                        </div>
                        <div className='bg-white/5 border border-white/10 p-5 rounded-xl'>
                            <h4 className='font-bold text-parchment-100 mb-2 flex items-center gap-2'>
                                <span className='text-mystic-gold'>3.</span>
                                {hp.p3_tip3Title}
                            </h4>
                            <p className='text-sm text-parchment-300 leading-relaxed'>
                                {parseBold(hp.p3_tip3Desc)}
                            </p>
                        </div>
                        <div className='bg-white/5 border border-white/10 p-5 rounded-xl'>
                            <h4 className='font-bold text-parchment-100 mb-2 flex items-center gap-2'>
                                <span className='text-mystic-gold'>4.</span>
                                {hp.p3_tip4Title}
                            </h4>
                            <p className='text-sm text-parchment-300 leading-relaxed'>
                                {parseBold(hp.p3_tip4Desc)}
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/* PART 4: TIPS FOR STORYTELLERS */}
                {/* ================================================================ */}
                <section id='part4' className='scroll-mt-24 space-y-8 pb-16'>
                    <h2 className='font-tarot text-3xl text-mystic-gold uppercase tracking-widest border-b border-mystic-gold/20 pb-4'>
                        {hp.part4Title}
                    </h2>

                    <div className='space-y-6'>
                        <div>
                            <h3 className='text-xl text-parchment-100 font-bold flex items-center gap-2 mb-3'>
                                {hp.p4_firstTitle}
                            </h3>
                            <ul className='list-disc pl-5 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p4_first1)}</li>
                                <li>{parseBold(hp.p4_first2)}</li>
                                <li>{parseBold(hp.p4_first3)}</li>
                                <li>{parseBold(hp.p4_first4)}</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl text-parchment-100 font-bold flex items-center gap-2 mb-3'>
                                {hp.p4_duringTitle}
                            </h3>
                            <ul className='list-disc pl-5 space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p4_during1)}</li>
                                <li>{parseBold(hp.p4_during2)}</li>
                                <li>{parseBold(hp.p4_during3)}</li>
                                <li>{parseBold(hp.p4_during4)}</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className='text-xl text-parchment-100 font-bold flex items-center gap-2 mb-3'>
                                {hp.p4_pitfallsTitle}
                            </h3>
                            <ul className='space-y-2 text-parchment-300'>
                                <li>{parseBold(hp.p4_pitfalls1)}</li>
                                <li>{parseBold(hp.p4_pitfalls2)}</li>
                                <li>{parseBold(hp.p4_pitfalls3)}</li>
                                <li>{parseBold(hp.p4_pitfalls4)}</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
