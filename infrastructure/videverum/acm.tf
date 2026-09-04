# The videverum.com certificate (SANs: videverum.com, www.videverum.com) already
# exists, is DNS-validated, and auto-renews. Its validation CNAMEs live in the
# Namecheap zone, not here. Importing it as a managed resource would add
# destroy/recreate risk for zero benefit, so it is referenced read-only.
#
# When DNS moves to Route 53 in a later phase, this can become a managed
# aws_acm_certificate + aws_acm_certificate_validation pair.

data "aws_acm_certificate" "site" {
  domain      = "videverum.com"
  statuses    = ["ISSUED"]
  most_recent = true
}
