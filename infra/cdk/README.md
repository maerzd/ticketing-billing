# CDK Infrastructure

This workspace contains AWS CDK infrastructure for billing data storage.

## Stack resources

- DynamoDB table `Organizers`
- DynamoDB table `BillingRecords`
- GSI `StatusIndex` on `BillingRecords` (`status`, `triggered_at`)
- GSI `EventIndex` on `BillingRecords` (`event_id`)

## Design choices

- Billing mode: `PAY_PER_REQUEST`
- Removal policy: `RETAIN`
- Point-in-time recovery: enabled
- Encryption: AWS managed key
- Explicit table names for stable application configuration

## Commands

From repository root:

```bash
yarn cdk:synth
yarn cdk:diff
yarn cdk:bootstrap
yarn cdk:deploy
```

From this directory:

```bash
yarn synth
yarn diff
yarn bootstrap
yarn deploy
```
