import { useAuth } from '../contexts/AuthContext'
import { Bell, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'

export default function KeyTimeframes() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('business-law')

  const categories = [
    { id: 'business-law', label: 'Business Law', count: 18 },
    { id: 'criminal-practice', label: 'Criminal Practice', count: 18 },
    { id: 'dispute-resolution', label: 'Dispute Resolution', count: 16 },
    { id: 'land-law', label: 'Land Law', count: 12 },
    { id: 'legal-services', label: 'Legal Services', count: 14 },
    { id: 'professional-ethics', label: 'Professional Ethics', count: 9 },
    { id: 'property-practice', label: 'Property Practice', count: 15 },
    { id: 'wills-admin', label: 'Wills & Admin', count: 11 },
    { id: 'solicitors-accounts', label: 'Solicitors Accounts', count: 8 },
  ]

  const timeframes: Record<string, any[]> = {
    'business-law': [
      { title: 'Notice of General Meeting', timeframe: 'At least 14 clear days', description: '"Clear" means excluding the day of service and the day of the meeting.', authority: 'CA 2006 s. 307', dayType: 'Calendar' },
      { title: 'GM (Shareholder Request)', timeframe: 'Board must call within 21 days', description: 'Meeting must then be held within 28 days of the notice.', authority: 'CA 2006 s. 304', dayType: 'Calendar' },
      { title: 'Special Resolutions', timeframe: 'Must be filed within 15 days', description: 'Copy of the resolution must be sent to the Registrar of Companies.', authority: 'CA 2006 s. 30', dayType: 'Calendar' },
      { title: 'Charge Registration', timeframe: 'Within 21 days', description: 'Includes weekends/bank holidays; late delivery requires a court order.', authority: 'CA 2006 s. 859A', dayType: 'Calendar' },
      { title: 'Removal of Director', timeframe: '28 days (Special Notice)', description: 'Notice of intention to remove must be given to the company.', authority: 'CA 2006 s. 312', dayType: 'Calendar' },
      { title: 'Director Representations', timeframe: 'At least 14 days before GM', description: 'If special notice is not practicable, the company must advertise it.', authority: 'CA 2006 s. 169', dayType: 'Calendar' },
      { title: 'Share Buyback (Capital)', timeframe: '5 to 7 weeks window', description: 'Payment made 5–7 weeks after the special resolution is passed.', authority: 'CA 2006 s. 723', dayType: 'Calendar' },
      { title: 'Registration of Director', timeframe: 'Within 14 days of change', description: 'Form AP01 (appointment) or TM01 (termination) to Companies House.', authority: 'CA 2006 s. 167', dayType: 'Calendar' },
      { title: 'First Registration', timeframe: '2 months from completion', description: 'Statutory deadline for first registration of a property (if applicable).', authority: 'LRA 2002', dayType: 'Calendar' },
      { title: 'Moratorium (Insolvency)', timeframe: 'Initial 20 business days', description: 'Can be extended for a further 20 business days.', authority: 'CIGA 2020', dayType: 'Business' },
      { title: 'Corporation Tax (Small)', timeframe: '9 months and 1 day', description: 'Deadline for payment after the end of the accounting period.', authority: 'Finance Act', dayType: 'Calendar' },
      { title: 'Corporation Tax (Large)', timeframe: 'Quarterly instalments', description: 'Large companies pay in 4 instalments during and after the period.', authority: 'Finance Act', dayType: 'Calendar' },
      { title: 'VAT Registration', timeframe: 'Within 30 days', description: 'Required if taxable turnover exceeds the threshold in a 12-month period.', authority: 'VATA 1994', dayType: 'Calendar' },
      { title: 'Accounting Records', timeframe: '3 or 6 years', description: 'Private companies (3 yrs); Public companies (6 yrs).', authority: 'CA 2006 s. 388', dayType: 'Calendar' },
      { title: 'Change Company Name', timeframe: '15 days (Filing)', description: 'Requires Special Resolution (≥ 75%).', authority: 'CA 2006 s. 77(1)', dayType: 'Calendar' },
      { title: 'Amend Articles', timeframe: '15 days (Filing)', description: 'Requires Special Resolution (≥ 75%).', authority: 'CA 2006 s. 21(1)', dayType: 'Calendar' },
      { title: 'Appoint a Director', timeframe: '14 days (Form AP01)', description: 'Requires Ordinary Resolution (> 50%).', authority: 'CA 2006 s. 160', dayType: 'Calendar' },
      { title: 'Remove a Director', timeframe: '14 days (Form TM01)', description: 'Requires Ordinary Resolution (> 50%).', authority: 'CA 2006 s. 168', dayType: 'Calendar' },
    ],
    'criminal-practice': [
      { title: 'Detention without charge', timeframe: '24 hours', description: 'From relevant time. Initial maximum period.', authority: 'PACE s.41' },
      { title: 'Superintendent extension', timeframe: 'Up to 36 hours total', description: 'Indictable offences only.', authority: 'PACE s.42' },
      { title: 'Magistrates’ extension', timeframe: 'Up to 96 hours total', description: 'Application to magistrates.', authority: 'PACE s.43–44' },
      { title: 'Review of detention', timeframe: '6h, then every 9h', description: 'First review at 6 hours, then periodically.', authority: 'PACE s.40' },
      { title: 'Delay legal advice', timeframe: 'Up to 36 hours', description: 'Indictable offences only. Rare.', authority: 'PACE s.58(6)' },
      { title: 'Delay informing arrest', timeframe: 'Up to 36 hours', description: 'Inspector authorisation required.', authority: 'PACE s.56' },
      { title: 'Charge to 1st appearance', timeframe: 'Next sitting day', description: 'If held in custody.', authority: 'CrimPR' },
      { title: 'IDPC', timeframe: 'Before plea', description: 'Initial details of prosecution case.', authority: 'CrimPR Part 8' },
      { title: 'Summary offence limit', timeframe: '6 months', description: 'From date of offence to laying information.', authority: 'MCA 1980' },
      { title: 'Custody time limit (Mags)', timeframe: '182 days', description: 'From first remand.', authority: 'CTLR 1987' },
      { title: 'Custody time limit (Crown)', timeframe: '182 days', description: 'From sending.', authority: 'CTLR 1987' },
      { title: 'Defence statement (Crown)', timeframe: '28 days', description: 'After prosecution disclosure.', authority: 'CPIA 1996' },
      { title: 'Defence statement (Mags)', timeframe: '14 days', description: 'After prosecution disclosure.', authority: 'CPIA 1996' },
      { title: 'Pros. response to Defence', timeframe: '14 days', description: 'Response to defence statement.', authority: 'CPIA 1996' },
      { title: 'Notice of hearsay', timeframe: 'ASAP', description: 'As soon as practicable.', authority: 'CJA 2003' },
      { title: 'Bad character application', timeframe: '14 days before trial', description: 'Minimum notice period.', authority: 'CrimPR Part 21' },
      { title: 'Appeal from magistrates', timeframe: '21 days', description: 'From sentence or conviction.', authority: 'MCA 1980 s.108' },
    ],
    'dispute-resolution': [
      { title: 'Limitation (Contract)', timeframe: '6 years', description: 'From breach of contract.', authority: 'Limitation Act 1980', dayType: 'Calendar' },
      { title: 'Limitation (Tort/Neg)', timeframe: '3 years', description: 'From injury or date of knowledge.', authority: 'Limitation Act 1980', dayType: 'Calendar' },
      { title: 'Response to Prof. Neg', timeframe: '21 days', description: 'Acknowledgment of Preliminary Notice.', authority: 'Pre-Action Protocol', dayType: 'Calendar' },
      { title: 'Investigate Prof. Neg', timeframe: '3 months', description: 'Period to investigate and send Letter of Response.', authority: 'Pre-Action Protocol', dayType: 'Calendar' },
      { title: 'Service of Claim Form', timeframe: '4 months', description: 'Within 4 months of issue.', authority: 'CPR Part 7', dayType: 'Calendar' },
      { title: 'Deemed Service (Post)', timeframe: '2nd business day', description: 'After posting.', authority: 'CPR r. 6.14', dayType: 'Business' },
      { title: 'Ack. of Service', timeframe: '14 days', description: 'After service of Particulars of Claim (POC).', authority: 'CPR Part 10', dayType: 'Calendar' },
      { title: 'Filing a Defence', timeframe: '14 or 28 days', description: '14 days normally, 28 if AoS filed.', authority: 'CPR Part 15', dayType: 'Calendar' },
      { title: 'Defence Extension', timeframe: 'Up to 28 days', description: 'By agreement without court order.', authority: 'CPR r. 15.5', dayType: 'Calendar' },
      { title: 'Directions Questionnaire', timeframe: 'See Notice', description: 'Usually 14 or 28 days.', authority: 'CPR Part 26', dayType: 'Calendar' },
      { title: 'Small Claims Track', timeframe: '< £10,000', description: 'Value limit for small claims.', authority: 'CPR Part 26' },
      { title: 'Fast Track', timeframe: '£10k - £25k', description: 'Trial usually 1 day.', authority: 'CPR Part 26' },
      { title: 'Intermediate Track', timeframe: '£25k - £100k', description: 'Not too complex cases.', authority: 'CPR Part 26' },
      { title: 'Multi-Track', timeframe: '> £100,000', description: 'Complex/High value.', authority: 'CPR Part 26' },
      { title: 'Trial Bundle Filing', timeframe: '3-7 days before', description: 'Before trial.', authority: 'CPR Part 39', dayType: 'Calendar' },
      { title: 'Permission to Appeal', timeframe: '21 days', description: 'From date of decision.', authority: 'CPR Part 52', dayType: 'Calendar' },
    ],
    'land-law': [
      { title: 'Proof of Title (Unregistered)', timeframe: '15 years', description: 'Must show good root of title at least 15 years old.', authority: 's. 44 LPA 1925', dayType: 'Calendar' },
      { title: 'First Registration', timeframe: '2 months', description: 'From trigger event (sale, gift, etc).', authority: 's. 6 LRA 2002', dayType: 'Calendar' },
      { title: 'Late First Registration', timeframe: 'Voids legal estate', description: 'Title reverts to transferor if missed.', authority: 's. 7 LRA 2002' },
      { title: 'Notice to Complete', timeframe: '10 working days', description: 'Time becomes of the essence.', authority: 'Standard Conditions', dayType: 'Working' },
      { title: 'OS1 Priority', timeframe: '30 working days', description: 'Protects buyer application.', authority: 'LRA 2002', dayType: 'Working' },
      { title: 'K15 Priority', timeframe: '15 working days', description: 'Land Charges (Unregistered).', authority: 'LCA 1972', dayType: 'Working' },
      { title: 'Lease Creation (Parol)', timeframe: '3 years or less', description: 'Can be legal without deed if specific conditions met.', authority: 's. 54(2) LPA 1925', dayType: 'Calendar' },
      { title: 'Adverse Possession (Reg)', timeframe: '10 years', description: 'Can apply for registration.', authority: 'LRA 2002', dayType: 'Calendar' },
      { title: 'Adverse Possession (Unreg)', timeframe: '12 years', description: 'Owner title extinguished.', authority: 'Limitation Act 1980', dayType: 'Calendar' },
      { title: 'Home Rights', timeframe: 'Marriage/Death', description: 'Until end of marriage or death.', authority: 's. 30 FLA 1996', dayType: 'Calendar' },
      { title: 'Notice of Severance', timeframe: 'Immediate', description: 'Upon delivery to last known address.', authority: 's. 196 LPA 1925' },
    ],
    'legal-services': [
      { title: 'IHT Payment (Death)', timeframe: 'End of 6 months', description: 'After month of death.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'IHT on LCTs (Apr-Sep)', timeframe: 'By 30 April', description: 'For transfers made 6 Apr - 30 Sep.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'IHT on PETs', timeframe: 'End of 6 months', description: 'After month of death if PET becomes taxable.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'IHT Correction', timeframe: 'Within 6 months', description: 'After discovering error.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'Grant of Representation', timeframe: '6 months (Rec)', description: 'Recommended wait to avoid 1975 Act claims.', authority: 'Inheritance Act 1975', dayType: 'Calendar' },
      { title: 'Section 27 Notice', timeframe: '2 months', description: 'Creditors notice period.', authority: 'Trustee Act 1925', dayType: 'Calendar' },
      { title: 'Variation of Will', timeframe: 'Within 2 years', description: 'For tax reading back.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'Disclaimer of Gift', timeframe: 'Within 2 years', description: 'To avoid tax consequences.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'AML Moratorium', timeframe: '31 days', description: 'NCA investigation period.', authority: 'POCA 2002', dayType: 'Calendar' },
      { title: 'Internal Complaint', timeframe: '8 weeks', description: 'To resolve before Legal Ombudsman.', authority: 'LeO', dayType: 'Calendar' },
      { title: 'Filing Special Resolutions', timeframe: '15 days', description: 'Companies House filing.', authority: 'CA 2006', dayType: 'Calendar' },
      { title: 'Charge Registration', timeframe: '21 days', description: 'Companies House filing.', authority: 'CA 2006', dayType: 'Calendar' },
      { title: 'GM Notice', timeframe: '14 clear days', description: 'Shareholders meeting.', authority: 'CA 2006', dayType: 'Calendar' },
    ],
    'professional-ethics': [
      { title: 'Internal Complaint', timeframe: '8 weeks', description: 'Max time to resolve before LeO.', authority: 'LeO', dayType: 'Calendar' },
      { title: 'SRA Response', timeframe: 'As specified', description: 'Must respond promptly.', authority: 'SRA Code', dayType: 'Calendar' },
      { title: 'Reporting Serious Breaches', timeframe: 'Promptly', description: 'Obligation to report to SRA.', authority: 'SRA Code' },
      { title: 'Reporting to COLP/COFA', timeframe: 'Promptly', description: 'Internal reporting obligation.', authority: 'SRA Code' },
      { title: 'Prof. Neg. Ack.', timeframe: '21 days', description: 'Acknowledge Preliminary Notice.', authority: 'Pre-Action Protocol', dayType: 'Calendar' },
      { title: 'Prof. Neg. Investigation', timeframe: '3 months', description: 'Provide Letter of Response.', authority: 'Pre-Action Protocol', dayType: 'Calendar' },
      { title: 'Deemed Service', timeframe: '2nd business day', description: 'Court documents.', authority: 'CPR r. 6.14', dayType: 'Business' },
      { title: 'Solicitor Bill Challenge', timeframe: '1 month', description: 'Right to assessment.', authority: 'Solicitors Act 1974', dayType: 'Calendar' },
    ],
    'property-practice': [
      { title: 'EPC Provision', timeframe: '7 days', description: 'Preferably 7, max 28 days.', authority: 'EPC Regs', dayType: 'Calendar' },
      { title: 'Planning Enforcement (Op)', timeframe: '4 years (Old)', description: 'Pre-April 2024 works.', authority: 'TCPA 1990', dayType: 'Calendar' },
      { title: 'Planning Enforcement (Gen)', timeframe: '10 years', description: 'Standard limit as of Apr 2024.', authority: 'TCPA 1990', dayType: 'Calendar' },
      { title: 'Enforcement Appeal', timeframe: '< 28 days', description: 'Before notice takes effect.', authority: 'TCPA 1990', dayType: 'Calendar' },
      { title: 'Notice to Complete', timeframe: '10 working days', description: 'Time of essence.', authority: 'SC / SCPC', dayType: 'Working' },
      { title: 'OS1 Priority', timeframe: '30 working days', description: 'Registered land protection.', authority: 'LRA 2002', dayType: 'Working' },
      { title: 'K15 Priority', timeframe: '15 working days', description: 'Unregistered land protection.', authority: 'LCA 1972', dayType: 'Working' },
      { title: 'SDLT Submission', timeframe: '14 days', description: 'Pay tax to HMRC.', authority: 'Finance Act', dayType: 'Calendar' },
      { title: 'LTT Submission', timeframe: '30 days', description: 'Pay tax to WRA (Wales).', authority: 'LTT', dayType: 'Calendar' },
      { title: 'Mortgage Reg (Company)', timeframe: '21 days', description: 'Companies House.', authority: 'Companies Act', dayType: 'Calendar' },
      { title: 'First Registration', timeframe: '2 months', description: 'Mandatory.', authority: 'LRA 2002', dayType: 'Calendar' },
      { title: 's.25 Notice (Landlord)', timeframe: '6-12 months', description: 'Terminate/Renew business tenancy.', authority: 'LTA 1954', dayType: 'Calendar' },
      { title: 's.26 Request (Tenant)', timeframe: '6-12 months', description: 'Request new lease.', authority: 'LTA 1954', dayType: 'Calendar' },
      { title: 'Notice of Assignment', timeframe: '1 month', description: 'Notify landlord.', authority: 'Lease terms', dayType: 'Calendar' },
    ],
    'wills-admin': [
      { title: 'IHT Payment (Death)', timeframe: 'End of 6 months', description: 'After month of death.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'IHT on PETs', timeframe: 'End of 6 months', description: 'If taxable.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'IHT on LCTs', timeframe: 'By 30 April', description: 'Transfers 6 Apr-30 Sep.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'IHT Instalments', timeframe: '10 years', description: 'Annual instalments available.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'Family Provision', timeframe: '6 months', description: 'From Grant of Representation.', authority: '1975 Act', dayType: 'Calendar' },
      { title: 's.27 Notice', timeframe: '2 months', description: 'Creditor advertisement.', authority: 'Trustee Act 1925', dayType: 'Calendar' },
      { title: 'Pecuniary Legacies', timeframe: '1 year', description: 'Executor\'s year. Interest accrues after.', authority: 'AEA 1925', dayType: 'Calendar' },
      { title: 'IHT Correction', timeframe: '6 months', description: 'Notify HMRC of error.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'Variation of Will', timeframe: '2 years', description: 'Tax reading back.', authority: 'IHTA 1984', dayType: 'Calendar' },
      { title: 'Disclaimer of Gift', timeframe: '2 years', description: 'Avoid tax consequences.', authority: 'IHTA 1984', dayType: 'Calendar' },
    ],
    'solicitors-accounts': [
      { title: 'The 5-Week Rule', timeframe: 'Every 5 weeks', description: 'Must perform reconciliation matches.', authority: 'SRA Accounts Rules' },
      { title: 'Firm Transfer (Mixed)', timeframe: '14 days', description: 'Transfer firm\'s part of mixed cheque.', authority: 'SRA Accounts Rules' },
      { title: 'VAT Submission', timeframe: 'Quarterly', description: 'Standard VAT return period.', authority: 'HMRC' },
      { title: 'Accountant\'s Report', timeframe: '6 months', description: 'Submit within 6 months of accounting period end.', authority: 'SRA Accounts Rules' },
      { title: 'Record Retention', timeframe: '6 years', description: 'Keep accounting records.', authority: 'SRA Accounts Rules' },
      { title: 'Client Money', timeframe: 'Promptly', description: 'Must be paid into client account promptly.', authority: 'SRA Accounts Rules' },
      { title: 'Bill Delivery', timeframe: 'Before transfer', description: 'Must deliver bill before transferring money for costs.', authority: 'SRA Accounts Rules' },
      { title: 'Residual Balances', timeframe: 'Promptly', description: 'Return to client promptly after matter ends.', authority: 'SRA Accounts Rules' },
    ]
  }



  return (
    <DashboardLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              ⏱️ Key Timeframes
            </h1>
            <p className="text-gray-600">Essential legal timeframes and limitation periods across all areas of law</p>
          </div>

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
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${selectedCategory === cat.id
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
          {timeframes[selectedCategory] ? timeframes[selectedCategory].map((tf, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{tf.title}</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-blue-600">{tf.timeframe}</div>
                      {/* Authority Badge */}
                      <div className="px-3 py-1 rounded-full text-sm font-semibold border bg-blue-100 text-blue-700 border-blue-200">
                        Authority: {tf.authority}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-6">{tf.description}</p>


              </div>
            </div>
          )) : (
            <div className="text-center p-8 text-gray-500">
              No timeframes found for this category.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
