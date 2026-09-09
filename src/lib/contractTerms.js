// A template Energy Installation Contract covering the same ground as a real
// Australian solar/battery retail contract under the New Energy Tech Consumer
// Code (NETCC) and Australian Consumer Law: interpretation, definitions,
// obligations, complaints handling, grid connection, payment, variations,
// completion, termination, and STC assignment.
//
// This is a STARTING TEMPLATE, not a substitute for legal advice. Clause
// wording, liability limits, and termination rights should be reviewed by a
// qualified lawyer for the retailer's own state/territory and business
// before being used with real customers — this is stated plainly on the
// proposal page itself, not just here.
//
// State/territory Fair Trading contact details are public government
// information, current as of this build.
export const FAIR_TRADING_CONTACTS = [
  { region: 'ACT', name: 'Access Canberra (Fair Trading)', phone: '13 22 81' },
  { region: 'NSW', name: 'NSW Fair Trading', phone: '13 32 20' },
  { region: 'NT', name: 'NT Consumer Affairs', phone: '1800 019 319' },
  { region: 'QLD', name: 'Office of Fair Trading', phone: '13 74 68' },
  { region: 'SA', name: 'Consumer and Business Services', phone: '13 18 82' },
  { region: 'TAS', name: 'Consumer, Building and Occupational Services', phone: '1300 654 499' },
  { region: 'VIC', name: 'Consumer Affairs Victoria', phone: '1300 558 181' },
  { region: 'WA', name: 'Consumer Protection WA', phone: '1300 304 054' },
];

export function buildContractSections({ retailerName, retailerAbn, retailerAddress, ownerName, ownerAddress, systemPrice, stcAmount, totalPrice, depositPercent, depositAmount, warrantyYears, state }) {
  const dep = depositPercent ?? 10;
  const balance = 100 - dep;

  return [
    {
      title: '1. Interpretation',
      paragraphs: [
        'This document, its Schedules, and the Proposal it is issued with together form the "Contract" between the Owner and the Retailer for the sale and installation of the energy system described in the Proposal (the "System").',
        'If there is any inconsistency between these Details, the Special Conditions, these Terms and Conditions, the Schedule of Rates, and the System Specifications, the documents take precedence in that order unless a later document expressly overrides an earlier one.',
        'Headings are for convenience only and do not affect interpretation. Words importing the singular include the plural and vice versa.',
      ],
    },
    {
      title: '2. Definitions',
      definitions: [
        ['Approval', "Any consent, permit, or approval required from a network distributor, building authority, or other regulator for the System's installation or grid connection."],
        ['Completion', 'The point at which the System is installed, commissioned, and capable of generating or storing electricity in accordance with this Contract.'],
        ['Contractual Warranty', `The workmanship warranty described in clause 11, for a period of ${warrantyYears || '[insert]'} years from Completion.`],
        ['Deposit', `${dep}% of the Total Price Payable, due on execution of this Contract.`],
        ['Distributor', "The local electricity network operator responsible for the property's electricity connection."],
        ['Energy System Installation', 'The supply, delivery, and installation of the System at the property described in the Proposal.'],
        ['Execution', 'The date both parties have signed this Contract, whether by manual or electronic signature.'],
        ['GST', 'Goods and Services Tax under A New Tax System (Goods and Services Tax) Act 1999 (Cth).'],
        ['NETCC', 'The New Energy Tech Consumer Code, the industry code of conduct this Contract is issued under (where the Retailer is a signatory).'],
        ['Owner', 'The person(s) named as the customer in the Proposal, being the owner or authorised occupier of the property.'],
        ['Proposal', 'The solar/battery system proposal document this Contract is attached to or referenced by, including the System Details and pricing summary.'],
        ['Retailer', 'The business named in the Proposal that is supplying and installing the System.'],
        ['STC', 'A Small-scale Technology Certificate created under the Renewable Energy (Electricity) Act 2000 (Cth).'],
        ['System Price', 'The full retail price of the System before any STC incentive is deducted.'],
        ['Total Price Payable', 'The System Price less the STC incentive (and any other rebates applied), being the amount the Owner is required to pay.'],
        ['Variation', 'A change to the scope, price, or timing of the Energy System Installation agreed in writing by both parties after Execution.'],
      ],
    },
    {
      title: '3. Performance Obligations',
      paragraphs: [
        "The Retailer must arrange delivery and installation of the System with reasonable care and skill, and in accordance with all applicable Australian Standards, manufacturer instructions, and Distributor requirements.",
        'The Owner must provide safe and reasonable access to the property for the Retailer to carry out the Energy System Installation, and warrants that they have full authority to allow the installation and that the property (including the roof structure, where applicable) is structurally suitable.',
        "The Retailer is not liable for pre-existing defects in the property, damage arising from the property's non-disclosed condition, or loss caused by circumstances outside the Retailer's reasonable control.",
        'Where site conditions outside the Retailer\'s control are discovered during installation (for example, meter panel faults, non-compliant existing wiring, or the need for additional switchboard work), the Retailer may raise this as a Variation before continuing that part of the work.',
      ],
    },
    {
      title: '4. Consumer Code Compliance',
      paragraphs: [
        'Where the Retailer is a signatory to the New Energy Tech Consumer Code, the Retailer commits to the standards set out in that Code, including using components that function as described, following industry best practice, and resolving warranty claims within a reasonable timeframe.',
        "The Retailer's obligations under this Contract are not reduced by subcontracting any part of the Energy System Installation; the Retailer remains responsible for the acts and omissions of its subcontractors and supply chain.",
        'The Retailer must carry out the Energy System Installation safely and in compliance with applicable work health and safety legislation.',
      ],
    },
    {
      title: '5. Complaints Handling',
      paragraphs: [
        'A complaint about this Contract or the Energy System Installation may be lodged with the Retailer by phone, email, or in writing using the contact details in the Proposal. The Retailer will acknowledge a complaint and aim to resolve it within 15 business days, or 25 business days for complex matters, unless a longer period is agreed.',
        'If a complaint cannot be resolved directly with the Retailer, the Owner may contact their state or territory consumer protection agency:',
      ],
      table: FAIR_TRADING_CONTACTS,
    },
    {
      title: '6. Privacy and Metering',
      paragraphs: [
        "The Retailer will handle the Owner's personal information in accordance with the Privacy Act 1988 (Cth) and will address reasonable privacy questions from the Owner on request.",
        "The Owner acknowledges that installing the System may result in the Distributor or retailer applying a new electricity tariff. The Retailer will provide reasonable post-installation assistance confirming the System's performance, including a demonstration or written instructions for monitoring output.",
      ],
    },
    {
      title: '7. Grid Connection Approval',
      paragraphs: [
        'Where the Retailer applies for grid connection on the Owner\'s behalf (Clause 7.1): the Retailer will lodge the application in a timely manner, provide progress updates, respond promptly to Distributor requests, and notify the Owner of the outcome. If the application is refused for reasons outside the Owner\'s control, the Owner may terminate this Contract and receive a full refund of amounts paid, less any costs already reasonably incurred.',
        'Where the Owner applies for grid connection directly (Clause 7.2): the Owner will lodge the application in a timely manner, keep the Retailer informed, respond promptly to Distributor requests, and notify the Retailer of the outcome. The same termination and refund right applies if the application is refused.',
        'The Owner is responsible for all other approvals relevant to the property that are not the Retailer\'s responsibility under this Contract.',
      ],
    },
    {
      title: '8. Payment',
      paragraphs: [
        `The Retailer is entitled to the Total Price Payable in the instalments set out below. The Retailer will issue an invoice for each instalment, due within 15 business days of the invoice date.`,
      ],
      paymentTable: [
        { label: `Deposit (${dep}%)`, amount: depositAmount },
        { label: `Balance on Completion (${balance}%)`, amount: totalPrice != null && depositAmount != null ? totalPrice - depositAmount : null },
      ],
    },
    {
      title: '9. Variations',
      paragraphs: [
        'The Owner may request an increase, decrease, or change to the scope of the Energy System Installation. Any resulting price change will be valued using the Schedule of Rates or, where no rate applies, a reasonable market price, and must be agreed in writing before the varied work proceeds.',
        'If the Retailer\'s own supply costs materially increase before Completion due to circumstances outside its control, the Retailer may give the Owner written notice of the price impact. The Owner has 5 business days to accept the increase or terminate this Contract; no response within that time is treated as acceptance.',
      ],
    },
    {
      title: '10. Completion',
      paragraphs: [
        'Within 5 business days of the Retailer notifying the Owner that installation is complete, the Owner may inspect the System and provide a list of any outstanding issues. The Retailer will address genuine defects; if no issues are raised, Completion is taken to have occurred.',
        'Risk in and title to the System passes to the Owner at Completion.',
        'The completion date may be extended where delay is caused by the Owner, by weather preventing safe installation, or by supply delays outside the Retailer\'s reasonable control.',
      ],
    },
    {
      title: '11. Termination',
      paragraphs: [
        "The Owner may terminate this Contract, with a full refund of amounts paid less reasonable costs incurred, if: a Supply Chain Price increase under clause 9 is not accepted; grid connection approval is refused; the final design differs significantly from the Proposal and has not been agreed; or installation is delayed beyond the agreed timeframe for reasons within the Retailer's control, without the Owner's consent.",
        'The Retailer may terminate this Contract for non-payment, by written notice, and is entitled to be paid for work performed to that point and the cost of any materials already committed to the installation (with title in those materials passing to the Owner once paid for).',
      ],
    },
    {
      title: '12. Notices',
      paragraphs: [
        'A notice under this Contract must be in writing and delivered by hand or email to the address or email address in the Proposal (or a later address notified in writing). A notice is treated as received on the day of hand delivery, or when the sending email system confirms transmission.',
      ],
    },
    {
      title: '13. Warranty and Performance Relief',
      paragraphs: [
        `The Retailer provides the Contractual Warranty described above for ${warrantyYears || '[insert]'} years from Completion, covering defects in workmanship. This is in addition to, and does not replace, the manufacturer warranties on individual components.`,
        'The Contractual Warranty does not cover faults not reported within the warranty period, or damage caused by third parties, extreme weather beyond the System\'s design tolerance, misuse, neglect, or unauthorised repair or modification.',
      ],
    },
    {
      title: '14. Small-scale Technology Certificates (STCs)',
      paragraphs: [
        'STCs are a Commonwealth Government incentive created under the Renewable Energy (Electricity) Act 2000 (Cth); their market value fluctuates and is not fixed by government.',
        `The Retailer has calculated the STC incentive shown in the Proposal (${stcAmount != null ? `$${Number(stcAmount).toLocaleString()}` : '[insert]'}) based on the System's eligible capacity. In exchange for this discount, the Owner assigns to the Retailer all rights to create STCs for the System, and warrants that no STCs have previously been created or assigned for this installation, and that no other eligible system already exists at the property.`,
        "If this warranty is breached, the Total Price Payable increases to the full System Price, invoiced within 10 business days.",
      ],
    },
    {
      title: '15. Miscellaneous',
      paragraphs: [
        'All amounts in this Contract are GST-inclusive unless stated otherwise; the Retailer will issue a valid tax invoice for each payment.',
        `This Contract is governed by the law of ${state || 'the State or Territory in which the property is located'}.`,
        'This Contract may only be amended in writing signed by both parties. A failure to enforce a right under this Contract is not a waiver of that right. Neither party is liable for indirect or consequential loss. Termination does not affect rights accrued before termination.',
      ],
    },
    {
      title: 'Schedule 1 — Special Conditions',
      paragraphs: ['[No special conditions apply, unless listed here.]'],
    },
    {
      title: 'Schedule 2 — Schedule of Rates',
      paragraphs: ['Rates for Variations are as set out in the Proposal, or the Retailer\'s standard rates current at the time the Variation is agreed.'],
    },
    {
      title: 'Schedule 3 — System Specifications',
      paragraphs: ['As set out in the System Details section of the Proposal.'],
    },
  ];
}
