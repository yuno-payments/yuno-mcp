> Remember 
>- To add the JIRA number to the branch name (e.g. feature/JRA-NUMBER)
>- To add the JIRA number to the PR title
>- To add the JIRA number to the PR description
>- Delete this quote when you open the PR

***
## [JRA-NUMBER] [Pull request title]

### Description
[Provide a brief description of the changes and their purpose]

### What type of PR is this? (check all applicable)
- [ ] Refactor
- [ ] Feature
- [ ] Bug Fix
- [ ] Optimization
- [ ] Documentation Update
- [ ] Testing Coverage
- [ ] Other (Please describe)

### Related Tickets & Documents
[Cite any JIRA tickets or documents related to this PR]

## Database Checklist

### Migrations
- [ ] I have reviewed all included migrations with DBA Team.
- [ ] I have tested all migration scripts in a staging or development environment before production deployment.

### Complex Queries
- [ ] All complex SQL queries modifications / adding were checked against the optimization guide or DBA Team.

### Indexes & Performance
- [ ] I have all indexes in-place needed for my microservices to perform correctly.
- [ ] I've checked performance of my changes in a weekly Stress-Test session.

### Data Integrity and Constraints
- [ ] have ensured that all data integrity constraints such as foreign keys, unique constraints, and not null constraints are in place.

### Database Configuration Changes
- [ ] I have double-checked all changes to database pool configurations and made sure these are approved by the DBA.

### General Advice
- [ ] If reading this creates any doubts, pleaserefer to #dba_on_schedule for assistance.
- [ ] Do not hesitate to ask for help or a review of my database-related changes from the DBA Team.

## Security Checklist

### This PR introduces a new endpoint?
- [ ] Yes and I followed the bellow checklist:
  - [ ] I have added the necessary permission(s) to protect the endpoint.
  - [ ] I am not using any :userCode or :orgCode in the url or body. I am getting this user data from the user token
  - [ ] I have added the right account validation to the endpoint, preventing the user to access data from other accounts
- [ ] No

### This PR uses account codes to get or modify any information?
- [ ] Yes and I have added the right account validation to the endpoint, preventing the user to access data from other accounts
  - [ ] I tested that the affected endpoints accepts only accounts related to the user organization
  - [ ] I tested that the affected endpoints accepts only accounts where the user has permission to access
- [ ] No

### Data Governance Checklist (check all applicable)

- [ ] New tables and columns have comments in the migration file.
- [ ] The comments comply with the standard provided in the Confluence guide.
- [ ] Comments are written in English and do not contain special characters.
- [ ] For columns containing PII, the correct pii flag and category are included.
- [ ] Non-PII columns are correctly flagged as pii: false.

Note for more information check: https://yunopayments.atlassian.net/l/cp/TA1ZqM1n