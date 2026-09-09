// Written statements for the STC Assignment Form, covering both the
// long-established solar PV pathway (Renewable Energy (Electricity)
// Regulations 2001, reg 20AH) and the newer battery pathway under the
// Cheaper Home Batteries Program (small-scale technology certificates for
// batteries, administered by the Clean Energy Regulator from 1 July 2025).
//
// This wording is original to Capitalsun and structured to capture the same
// facts a Clean Energy Regulator-compliant written statement needs -- it is
// not a copy of any other business's proprietary form. Have it checked
// against the current CER guidance before relying on it for a real
// certificate assignment.

export function installerWrittenStatement({ hasBattery }) {
  const points = [
    "I am the person who installed the system described in this form, or I directly supervised its installation.",
    "I hold current Clean Energy Council (CEC) accreditation for the relevant installation type, and my accreditation was current on the date of installation.",
    "The installation was carried out in accordance with all applicable requirements of AS/NZS 5033 (stand-alone and grid-connected PV arrays), AS/NZS 4777 (grid connection of energy systems via inverters) and the CEC installation guidelines current at the time of installation.",
    "All equipment installed is listed on the Clean Energy Council's list of approved products current at the date of installation.",
    "The installation complies with all relevant electrical safety and wiring rules (AS/NZS 3000) and any additional requirements of the local network distributor.",
    "I have not received, and do not expect to receive, any other Commonwealth, State or Territory financial incentive for this installation that would make it ineligible to create small-scale technology certificates.",
    "To the best of my knowledge, the information provided in this form about the equipment installed, including brand, model and serial numbers, is true and correct.",
  ];
  if (hasBattery) {
    points.push(
      "The battery system installed is listed on the Clean Energy Regulator's list of battery products eligible under the Cheaper Home Batteries Program current at the date of installation.",
      "The battery system was installed at a residential or small business address and is connected to the stated solar PV or grid-connected system in accordance with the program rules."
    );
  }
  points.push(
    "I understand that giving false or misleading information in connection with the creation of small-scale technology certificates is a serious offence under the Renewable Energy (Electricity) Act 2000 and the Criminal Code Act 1995, and that penalties apply."
  );
  return points;
}

export function designerWrittenStatement({ hasBattery }) {
  const points = [
    "I am the person who designed the system described in this form.",
    "I hold current Clean Energy Council (CEC) accreditation for system design, and my accreditation was current on the date the design was prepared.",
    "The system was designed in accordance with AS/NZS 5033, AS/NZS 4777 and the CEC design guidelines current at the time.",
  ];
  if (hasBattery) {
    points.push(
      "The battery system was sized appropriately relative to the connected solar PV array and the customer's stated energy needs, in accordance with CEC battery design guidelines."
    );
  }
  points.push(
    "I understand that giving false or misleading information in connection with the creation of small-scale technology certificates is a serious offence under the Renewable Energy (Electricity) Act 2000 and the Criminal Code Act 1995, and that penalties apply."
  );
  return points;
}

export function retailerDeclaration({ hasBattery }) {
  const points = [
    "The installer named in this form installed the unit at the stated installation address, and is an employee or subcontractor of the retailer named in this form.",
    "The unit will perform in accordance with the contract (or accepted quote) for its sale to the owner, except to the extent performance is prevented by circumstances outside the retailer's control.",
    "The unit is complete and generating electricity, or is capable of generating electricity.",
    "If grid connected, the unit is connected to the grid, or the retailer has completed its obligations under the contract relating to grid connection.",
    "The retailer provided information in writing to the owner about feed-in tariffs and export limits for the unit, and that information is true, correct and complete.",
    "The retailer provided information in writing to the owner about the unit's expected payback period, expected energy savings or expected cost savings, and that information is true, correct and complete.",
    "Any actual or potential conflicts of interest relating to the sale or installation of the unit, or the creation of certificates for the unit, have been disclosed to the owner and managed appropriately.",
    "No declaration deeming the retailer ineligible to make a statement under regulation 20AH is in effect on the day this statement is given.",
  ];
  if (hasBattery) {
    points.push(
      "The retailer reasonably believes the battery system will remain installed at the premises until at least 1 January 2031, or the end of its warranty period, whichever is later.",
      "The battery system is, or is capable of being made, compatible with a virtual power plant (VPP) in accordance with the program requirements, unless an exemption applies.",
      "The battery system was appropriately sized relative to the connected solar PV module capacity at the premises.",
      "The owner has been given access to the retailer's modern slavery statement (or a statement that one is not required), where applicable."
    );
  }
  points.push(
    "The retailer understands that giving false or misleading information in connection with the creation of small-scale technology certificates is a serious offence under the Renewable Energy (Electricity) Act 2000, the Renewable Energy (Electricity) Regulations 2001, and the Criminal Code Act 1995, and that penalties apply."
  );
  return points;
}

export function customerDeclarationText({ aggregatorName }) {
  const name = aggregatorName || "the nominated STC agent";
  return (
    "I confirm that I am the owner of the small generation unit / battery system described in this form, that the " +
    "information I have provided is true and correct, and that I assign all right, title and interest in the small-scale " +
    "technology certificates that may be created for this system to " + name + ", " +
    "in exchange for the discount, goods or services described in the contract for this installation. I understand this " +
    "assignment is made under the Renewable Energy (Electricity) Act 2000 and cannot be assigned again once made."
  );
}
