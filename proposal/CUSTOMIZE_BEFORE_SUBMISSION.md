# Lee County proposal: required final edits

The generated PDF is a complete proposal draft based on the September 21, 2026 RFP and the working Lee County project in this folder.

Before placing it in the sealed submission package, update these facts in `generate_proposal.py` and regenerate the PDF:

1. Dylan's telephone number.
2. Dylan's mailing address.
3. Exact number of years in business.
4. Exact number of years of professional website design/development experience.
5. Any non-government references Dylan has permission to disclose. Do not label them as government clients.
6. Confirm or revise the $23,750 price, optional-service prices, 10-week schedule, and payment milestones.
7. Sign and date the certification page.

The RFP asks for five county/municipality references. Because none were supplied, the proposal contains a candid exception disclosure and asks the County to consider the working prototype and stronger acceptance controls instead. Do not remove that disclosure unless five truthful qualifying references are added.

## Regenerate

```sh
python3 -m pip install reportlab
python3 proposal/generate_proposal.py
```

Output: `proposal/output/Lee_County_Website_Redesign_Proposal_Dylan_Smith.pdf`

## Submission package

- Three hard copies.
- One complete PDF copy on a CD or flash drive.
- One sealed package labeled with the proposer's name and `Proposal for Website Redesign Services`.
- Deliver by 2:00 p.m. ET on Thursday, October 15, 2026.
- Do not submit by fax or email; a postmark does not meet the deadline.

