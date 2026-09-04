# Legacy data — `vv-incidents`

Export of the DynamoDB table `vv-incidents` (us-east-1), taken 2026-09-03 before the
table was deleted during the VideVerum corporate-site cleanup.

The table backed the UFO/UAP encyclopedia ("Vide Verum") admin + public API, neither of
which was ever deployed to production. It held 13 published editorial entries.

| File | Format |
|------|--------|
| `vv-incidents.json` | Lossless DynamoDB JSON (native type descriptors). Restore with `aws dynamodb batch-write-item`. |
| `vv-incidents.plain.json` | Deserialized plain JSON, sorted by `date_sort`. For reading / reuse. |

Exported record count: **13** (matched `scan --select COUNT` and `DescribeTable.ItemCount`).

Full UFO-era application source is preserved on the `archive/ufo-era` branch.
