import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Menu, X, Bell, Home, BarChart3, HelpCircle, Book, Video, Grid, Brain, FileText, Bot, Lightbulb, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/lawangelslogo.png'
import logotext from '../assets/logotext.png'

export default function KeyTimeframes() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('contract-law')

  const timeframes = {
    'contract-law': [
      {
        title: 'Prescription Period for Contract Claims',
        timeframe: '6 years (England & Wales)',
        significance: 'High',
        description: 'The standard limitation period for bringing claims in contract is 6 years from the date the cause of action arises. This is governed by the Limitation Act 1980, Section 5.',
        keyPoints: [
          'Runs from the date of breach',
          'Can be extended in certain circumstances',
          'Different for specialty contracts (12 years)',
          'Contract must be clear about the limitation period'
        ],
        example: 'If a contractor fails to complete work in January 2024, the claim must be brought by January 2030.',
        relatedCases: ['Robinson v Harman', 'Hadley v Baxendale']
      },
      {
        title: 'Acceptance Period for Goods',
        timeframe: '30 days (implied)',
        significance: 'High',
        description: 'Under the Sale of Goods Act 1979, goods are deemed to have been accepted within a "reasonable time". While no specific period is fixed, 30 days is commonly accepted as a guideline for determining acceptance.',
        keyPoints: [
          'Applies to contracts for the sale of goods',
          'Once accepted, claims for defects are limited',
          'Reasonableness is assessed on the facts',
          'Rejection must be communicated promptly'
        ],
        example: 'A buyer receives faulty goods on January 1st. If no rejection is communicated by January 31st, acceptance may be implied.',
        relatedCases: ['Reardon Smith Line Ltd v Ynysmedw Colliery (1954)']
      },
      {
        title: 'Cooling Off Period - Consumer Contracts',
        timeframe: '14 days',
        significance: 'Medium',
        description: 'Consumer Contracts Regulations 2013 provide a 14-day "cooling off" period for distance contracts and off-premises contracts, allowing consumers to cancel without penalty.',
        keyPoints: [
          'Only applies to consumer transactions',
          'Starts from order confirmation or delivery',
          'Consumer can cancel for any reason',
          'Exceptions apply to certain goods (food, etc.)'
        ],
        example: 'A consumer orders books online on January 1st. They can cancel the order until January 15th.',
        relatedCases: []
      },
      {
        title: 'Notice Period for Contract Termination',
        timeframe: 'Variable (commonly 30 days minimum)',
        significance: 'High',
        description: 'Contracts often require notice periods for termination. Common periods range from 7 days to 6 months depending on the contract type and employment status.',
        keyPoints: [
          'Must be expressly stated in contract',
          'Reasonable notice is implied if not specified',
          'Can be terminated with or without cause',
          'Length depends on nature of contract'
        ],
        example: 'An employment contract may require 1 month notice. An employee giving notice on January 1st would last until February 1st.',
        relatedCases: ['Malik v BCCI']
      }
    ],
    'criminal-law': [
      {
        title: 'Prosecution Limitation Period',
        timeframe: 'Variable (1-6 years depending on offense)',
        significance: 'High',
        description: 'Different offences have different time limits for prosecution. Summary offences typically have 6 months, while indictable offences often have 6 years or no limit.',
        keyPoints: [
          'Summary offences: 6 months from date of offense',
          'Indictable offences: usually no limit or 6 years',
          'Time runs from date of discovery, not offense',
          'Some serious crimes have no time limit'
        ],
        example: 'A theft (summary offense) must be prosecuted within 6 months of discovery.',
        relatedCases: []
      },
      {
        title: 'Appeal Deadline - Criminal Cases',
        timeframe: '28 days (Crown Court), 21 days (Magistrates)',
        significance: 'High',
        description: 'Defendants have strict time limits to appeal convictions. For Crown Court it\'s 28 days; for Magistrates courts, 21 days. Extensions may be granted for good reason.',
        keyPoints: [
          'Time runs from sentencing date',
          'Extensions possible but must be justified',
          'Different rules for conviction vs sentence appeals',
          'Notice of appeal must be lodged first'
        ],
        example: 'If sentenced on January 1st in the Crown Court, notice of appeal must be filed by January 29th.',
        relatedCases: []
      },
      {
        title: 'Custody Time Limits (Crown Court)',
        timeframe: '112 days (without extensions)',
        significance: 'High',
        description: 'The Crown Court has 112 days from first Crown Court appearance to trial, unless extended. This ensures trials happen within reasonable timeframe.',
        keyPoints: [
          'Applies to Crown Court proceedings',
          'Can be extended for good reason',
          'Protects rights to speedy trial',
          'Failures can result in case dismissal'
        ],
        example: 'An accused first appears in Crown Court on January 1st. Trial must commence by April 22nd.',
        relatedCases: []
      },
      {
        title: 'Conditional Discharge - Review Period',
        timeframe: '3-5 years (conditional)',
        significance: 'Medium',
        description: 'Conditional discharge sentences mean conviction is conditional on no further offences within a specified period. If breached, offender can be re-sentenced.',
        keyPoints: [
          'Period set by court (usually 1-5 years)',
          'No conviction recorded if complied with',
          'Breach allows original sentencing',
          'Appears on record during condition period'
        ],
        example: 'Given conditional discharge for 3 years on January 1st. If no further offense by December 31st (year 3), no conviction.',
        relatedCases: []
      }
    ],
    'property-law': [
      {
        title: 'Adverse Possession - Statutory Period',
        timeframe: '12 years (unregistered) / 10 years (registered)',
        significance: 'High',
        description: 'Squatters can acquire legal title to land through adverse possession. For unregistered land it\'s 12 years; for registered land it\'s 10 years (though registered proprietor can resist).',
        keyPoints: [
          'Possession must be factual and exclusive',
          'Must be without the owner\'s permission',
          'For registered land, owner can object',
          'Time restarts if possession is interrupted'
        ],
        example: 'Someone occupies land without permission from January 1, 2012. By January 1, 2024 (12 years), they may claim adverse possession.',
        relatedCases: ['Pye v Graham', 'JA Pye (Oxford) Ltd v UK (2007)']
      },
      {
        title: 'Leaseholder Extension Rights - Notice Period',
        timeframe: '6-12 months notice required',
        significance: 'Medium',
        description: 'Leaseholders have the right to extend their leases for 90 years. Notice must be given 6-12 months before the lease falls below 80 years.',
        keyPoints: [
          'Available once per 2 years',
          'Applies when lease < 80 years remaining',
          'Notice to landlord 6-12 months required',
          'Can be contested on specific grounds'
        ],
        example: 'A leaseholder with 79 years remaining must serve notice by the time 80.5 years remain.',
        relatedCases: ['Leasehold Reform, Housing and Urban Development Act 1993']
      },
      {
        title: 'Covenant Discharge/Modification - Appeal Period',
        timeframe: '12 months (Upper Tribunal)',
        significance: 'Medium',
        description: 'Applications to discharge or modify restrictive covenants to the Upper Tribunal must be appealed within 12 months if the party disagrees.',
        keyPoints: [
          'Application made to Upper Tribunal',
          'Objectors have right to oppose',
          'Appeal period is 12 months',
          'Grounds limited to specific circumstances'
        ],
        example: 'Upper Tribunal makes order on January 1st. Objector must appeal by January 1st of following year.',
        relatedCases: []
      },
      {
        title: 'Easement Prescription - Acquisition Period',
        timeframe: '20 years (absolute, long use)',
        significance: 'High',
        description: 'Easements can be acquired through prescription (long use). The period is 20 years of uninterrupted use as of right.',
        keyPoints: [
          'Use must be as of right (not permissive)',
          'Uninterrupted for 20 years',
          'No need to show intention',
          'Different rules for ancient easements'
        ],
        example: 'Public use of a path for 20 years without permission may establish a right of way.',
        relatedCases: ['Wheaton v Maple & Co.']
      }
    ],
    'tort-law': [
      {
        title: 'Negligence Claim Limitation Period',
        timeframe: '3 years (from discovery)',
        significance: 'High',
        description: 'Claims in negligence must be brought within 3 years from the date of damage discovery (not from the negligent act). The Limitation Act 1980 Section 14A applies.',
        keyPoints: [
          'Runs from discovery, not negligence date',
          'Court has discretion to extend (Section 33)',
          'Different rules for personal injury vs property',
          'Knowledge date is crucial'
        ],
        example: 'Negligent act occurs January 1, 2020. Damage discovered January 1, 2022. Claim must be brought by January 1, 2025.',
        relatedCases: ['Cartledge v Jopling', 'Smith v West Yorkshire Police']
      },
      {
        title: 'Defamation - Publication Timeframe',
        timeframe: '1 year (Defamation Act 2013)',
        significance: 'High',
        description: 'Under the Defamation Act 2013, defamation claims must be brought within 1 year from the date of publication. Courts have limited discretion to extend.',
        keyPoints: [
          'One year from publication date',
          'Applies to all forms of publication',
          'Limited court discretion for extension',
          'Repeated publication = new claim opportunity'
        ],
        example: 'Defamatory statement published January 1st. Claim must be brought by January 1st of following year.',
        relatedCases: ['Defamation Act 2013, Section 4']
      },
      {
        title: 'Personal Injury - Longstop Date',
        timeframe: '3 years from date of damage',
        significance: 'High',
        description: 'For personal injury, even if the claimant doesn\'t discover damage immediately, there\'s an absolute 3-year limit from the date of the negligent act (with exceptions).',
        keyPoints: [
          'Generally 3 years from damage',
          'Court discretion for reasonable extensions',
          'Applies to negligence and other torts',
          'Different for children (runs from age 18)'
        ],
        example: 'Negligent act causes injury January 1, 2021. Claim must be brought by January 1, 2024.',
        relatedCases: []
      },
      {
        title: 'Nuisance - Prescriptive Rights',
        timeframe: '20 years (for prescriptive rights)',
        significance: 'Medium',
        description: 'Someone may gain the right to commit a nuisance if they do so openly for 20 years without objection. This is established through the doctrine of prescriptive rights.',
        keyPoints: [
          'Requires 20 years of uninterrupted use',
          'Must be as of right (not by permission)',
          'Owner\'s objection breaks the period',
          'Rare in practice'
        ],
        example: 'A factory pollutes neighboring land for 20 years unchallenged. They may have acquired a prescriptive right.',
        relatedCases: []
      }
    ],
    'equity-trusts': [
      {
        title: 'Breach of Trust - Limitation Period',
        timeframe: '6 years (general) / No limit (dishonest breach)',
        significance: 'High',
        description: 'Claims for breach of trust generally have a 6-year limitation period from the date of breach. However, no limitation applies to claims involving dishonesty or fraud.',
        keyPoints: [
          'Standard period is 6 years',
          'No limit for dishonest breaches',
          'Time runs from date of breach',
          'Must be properly notified to trustee'
        ],
        example: 'Trustee misappropriates funds January 1, 2018 (knowingly). Claim can be brought at any time.',
        relatedCases: ['Limitation Act 1980, Section 21']
      },
      {
        title: 'Trust Administration - Accounting Period',
        timeframe: 'Annually (or as specified)',
        significance: 'Medium',
        description: 'Trustees must account to beneficiaries. While the trust deed may specify a period, annual accounting is standard practice and may be required by beneficiaries.',
        keyPoints: [
          'Trust deed may specify frequency',
          'Beneficiaries can demand accounting',
          'Annual accounting is customary',
          'Accounts must show all dealings'
        ],
        example: 'Trustee must provide annual accounts to beneficiaries showing all trust transactions.',
        relatedCases: []
      },
      {
        title: 'Beneficiary Notification - Notice Period',
        timeframe: 'Upon creation or within reasonable time',
        significance: 'High',
        description: 'For express trusts, beneficiaries should be notified promptly of the trust and their entitlements. While no fixed period applies, "reasonable time" is implied.',
        keyPoints: [
          'Notice should be prompt',
          'Can be implied from circumstances',
          'Failure may affect trustee\'s obligations',
          'Different for testamentary trusts'
        ],
        example: 'Trust created January 1st. Beneficiaries should be notified within reasonable time (typically weeks, not months).',
        relatedCases: []
      },
      {
        title: 'Trust Asset Distribution Timeline',
        timeframe: '12 months (Executor\'s Year)',
        significance: 'High',
        description: 'Executors/Trustees typically have 12 months (the "Executor\'s Year") to settle all debts, taxes, and make distributions. This provides a grace period for administration.',
        keyPoints: [
          'Runs from date of death',
          'Allows time for tax, debts, estate management',
          'After 12 months, interest may accrue',
          'Extensions possible with beneficiary consent'
        ],
        example: 'Testator dies January 1st. Executor has until January 1st (following year) to complete administration.',
        relatedCases: []
      }
    ]
  }

  const categories = [
    { id: 'contract-law', label: 'Contract Law', count: 4 },
    { id: 'criminal-law', label: 'Criminal Law', count: 4 },
    { id: 'property-law', label: 'Property Law', count: 4 },
    { id: 'tort-law', label: 'Tort Law', count: 4 },
    { id: 'equity-trusts', label: 'Equity & Trusts', count: 4 }
  ]

  const significanceColor = {
    'High': 'bg-red-50 text-red-700 border-red-200',
    'Medium': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Low': 'bg-green-50 text-green-700 border-green-200'
  }

  return (
    <div className="flex h-screen bg-gray-50 font-worksans">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <img src={logo} alt="logo" className='w-14' />
                <img src={logotext} alt="logo" className='w-[93px] h-[20px] mt-2 -mx-2' />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-6">
          {/* My Learning */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">My Learning</p>}
          <div className="space-y-2">
            <Link to="/dashboard" className="block">
              <NavItem icon={<Home className="w-5 h-5" />} label="Home" open={sidebarOpen} />
            </Link>
            <Link to="/my-courses" className="block">
              <NavItem icon={<BookOpen className="w-5 h-5" />} label="My Courses" open={sidebarOpen} />
            </Link>
            <Link to="/progress" className="block">
              <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Progress" open={sidebarOpen} />
            </Link>
            <Link to="/practice" className="block">
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice" open={sidebarOpen} />
            </Link>
          </div>

          {/* Learning Modes */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Modes</p>}
          <div className="space-y-2">
            <Link to="/textbook" className="block">
              <NavItem icon={<Book className="w-5 h-5" />} label="Textbook" open={sidebarOpen} />
            </Link>
            <Link to="/practice-questions" className="block">
              <NavItem icon={<HelpCircle className="w-5 h-5" />} label="Practice Questions" open={sidebarOpen} />
            </Link>
            <Link to="/video-tutorials" className="block">
              <NavItem icon={<Video className="w-5 h-5" />} label="Video Tutorial" open={sidebarOpen} />
            </Link>
            <Link to="/flashcards" className="block">
              <NavItem icon={<Grid className="w-5 h-5" />} label="Flashcard" open={sidebarOpen} />
            </Link>
            <Link to="/quizzes" className="block">
              <NavItem icon={<Brain className="w-5 h-5" />} label="Quizzes" open={sidebarOpen} />
            </Link>
            <Link to="/mock-questions" className="block">
              <NavItem icon={<FileText className="w-5 h-5" />} label="Mock Questions" open={sidebarOpen} />
            </Link>
          </div>

          {/* Learning Tools */}
          {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase px-4">Learning Tools</p>}
          <div className="space-y-2">
            <Link to="/angel-ai" className="block">
              <NavItem icon={<Bot className="w-5 h-5" />} label="Angel AI" open={sidebarOpen} />
            </Link>
            <Link to="/sqe-tips" className="block">
              <NavItem icon={<Lightbulb className="w-5 h-5" />} label="SQE Tips" open={sidebarOpen} />
            </Link>
            <Link to="/key-timeframes" className="block">
              <NavItem icon={<Clock className="w-5 h-5" />} label="Key Timeframes" active={true} open={sidebarOpen} />
            </Link>
          </div>
        </nav>

        {/* Settings & User Profile */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.first_name || 'User'}</p>
                <p className="text-xs text-gray-500">Premium Plan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">
                ⏱️ Key Timeframes
              </h1>
              <p className="text-gray-600">Essential legal timeframes and limitation periods across all areas of law</p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Search timeframes..."
                  className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Important Note on Limitation Periods</p>
              <p className="text-sm text-blue-800 mt-1">These timeframes are crucial for exam success. Missing a limitation deadline can bar a claim entirely. Always check the specific statute or case law applicable to the scenario given.</p>
            </div>
          </div>

          {/* Category Navigation */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-black mb-4">Browse by Subject</h2>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedCategory === cat.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframes Cards */}
          <div className="space-y-6">
            {timeframes[selectedCategory as keyof typeof timeframes].map((tf, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{tf.title}</h3>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-bold text-blue-600">{tf.timeframe}</div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${significanceColor[tf.significance as keyof typeof significanceColor]}`}>
                          {tf.significance} Significance
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-6">{tf.description}</p>

                  {/* Key Points */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Points:</h4>
                    <ul className="space-y-2">
                      {tf.keyPoints.map((point, pidx) => (
                        <li key={pidx} className="text-sm text-gray-700 flex items-start gap-3">
                          <span className="text-blue-500 font-bold mt-0.5">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Example */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Example:</h4>
                    <p className="text-sm text-gray-700">{tf.example}</p>
                  </div>

                  {/* Related Cases */}
                  {tf.relatedCases.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">Related Cases & Legislation:</h4>
                      <div className="flex flex-wrap gap-2">
                        {tf.relatedCases.map((cas, cidx) => (
                          <span key={cidx} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-200">
                            {cas}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reference */}
          <div className="mt-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-8 border border-blue-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Reference: Critical Periods</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'General Contract Claims', period: '6 years' },
                { title: 'Personal Injury Claims', period: '3 years' },
                { title: 'Defamation Claims', period: '1 year' },
                { title: 'Adverse Possession', period: '12 years (unregistered)' },
                { title: 'Consumer Cooling Off', period: '14 days' },
                { title: 'Criminal Appeal (Crown)', period: '28 days' },
                { title: 'Negligence Claims', period: '3 years' },
                { title: 'Breach of Trust', period: '6 years' },
                { title: 'Criminal Prosecution', period: 'Variable' }
              ].map((ref, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-gray-900 text-sm">{ref.title}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{ref.period}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  open,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  open: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      } ${open ? '' : 'justify-center'}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {open && <span className="text-sm">{label}</span>}
    </button>
  )
}
