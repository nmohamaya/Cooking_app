#!/usr/bin/env bash
# health-report-diff.sh — Compare latest two health reports and highlight regressions
#
# Usage: scripts/health-report-diff.sh
#
# Reads Markdown reports from tasks/health-reports/ and extracts key metrics.
# Flags regressions: test count drops, new vulnerabilities, coverage decreases.

set -euo pipefail

REPORTS_DIR="tasks/health-reports"

if [ ! -d "$REPORTS_DIR" ]; then
  echo "No health reports directory found at $REPORTS_DIR"
  exit 0
fi

# Get the two most recent reports
REPORTS=$(ls -1 "$REPORTS_DIR"/*.md 2>/dev/null | sort -r | head -2)
REPORT_COUNT=$(echo "$REPORTS" | wc -l)

if [ "$REPORT_COUNT" -lt 2 ]; then
  echo "Need at least 2 reports to compare. Found: $REPORT_COUNT"
  echo "Run the health-check agent to generate reports."
  exit 0
fi

LATEST=$(echo "$REPORTS" | head -1)
PREVIOUS=$(echo "$REPORTS" | tail -1)

echo "📊 Health Report Comparison"
echo "  Previous: $(basename "$PREVIOUS")"
echo "  Latest:   $(basename "$LATEST")"
echo ""

# Extract metrics from a report
extract_metric() {
  local file="$1"
  local pattern="$2"
  grep -oP "$pattern" "$file" 2>/dev/null | head -1 || echo ""
}

# Compare test counts
PREV_TESTS=$(extract_metric "$PREVIOUS" '\d+ tests' | grep -oP '\d+' || echo "?")
CURR_TESTS=$(extract_metric "$LATEST" '\d+ tests' | grep -oP '\d+' || echo "?")

echo "Tests:"
if [ "$PREV_TESTS" != "?" ] && [ "$CURR_TESTS" != "?" ]; then
  DIFF=$((CURR_TESTS - PREV_TESTS))
  if [ "$DIFF" -lt 0 ]; then
    echo "  ❌ REGRESSION: Test count dropped from $PREV_TESTS to $CURR_TESTS ($DIFF)"
  elif [ "$DIFF" -gt 0 ]; then
    echo "  ✅ Test count increased from $PREV_TESTS to $CURR_TESTS (+$DIFF)"
  else
    echo "  ➡️  Test count unchanged: $CURR_TESTS"
  fi
else
  echo "  ⚠️  Could not extract test counts from reports"
fi

# Compare vulnerability counts
PREV_VULNS=$(extract_metric "$PREVIOUS" '\d+ vulnerabilit' | grep -oP '\d+' || echo "?")
CURR_VULNS=$(extract_metric "$LATEST" '\d+ vulnerabilit' | grep -oP '\d+' || echo "?")

echo ""
echo "Security:"
if [ "$PREV_VULNS" != "?" ] && [ "$CURR_VULNS" != "?" ]; then
  if [ "$CURR_VULNS" -gt "$PREV_VULNS" ]; then
    echo "  ❌ REGRESSION: Vulnerabilities increased from $PREV_VULNS to $CURR_VULNS"
  elif [ "$CURR_VULNS" -lt "$PREV_VULNS" ]; then
    echo "  ✅ Vulnerabilities decreased from $PREV_VULNS to $CURR_VULNS"
  else
    echo "  ➡️  Vulnerability count unchanged: $CURR_VULNS"
  fi
else
  echo "  ⚠️  Could not extract vulnerability counts from reports"
fi

# Compare coverage
PREV_COV=$(extract_metric "$PREVIOUS" '\d+(\.\d+)?%\s*coverage' | grep -oP '[\d.]+' || echo "?")
CURR_COV=$(extract_metric "$LATEST" '\d+(\.\d+)?%\s*coverage' | grep -oP '[\d.]+' || echo "?")

echo ""
echo "Coverage:"
if [ "$PREV_COV" != "?" ] && [ "$CURR_COV" != "?" ]; then
  # Use awk for float comparison
  REGRESSION=$(awk "BEGIN { print ($CURR_COV < $PREV_COV) }")
  if [ "$REGRESSION" = "1" ]; then
    echo "  ⚠️  Coverage decreased from ${PREV_COV}% to ${CURR_COV}%"
  else
    echo "  ✅ Coverage: ${PREV_COV}% → ${CURR_COV}%"
  fi
else
  echo "  ⚠️  Could not extract coverage from reports"
fi

# Check for status changes
echo ""
echo "Status changes:"
PREV_STATUS=$(grep -oP '(✅|❌|⚠️)\s+\w+' "$PREVIOUS" 2>/dev/null | sort || echo "")
CURR_STATUS=$(grep -oP '(✅|❌|⚠️)\s+\w+' "$LATEST" 2>/dev/null | sort || echo "")

if [ "$PREV_STATUS" = "$CURR_STATUS" ]; then
  echo "  ➡️  No status changes between reports"
else
  echo "  Changed sections:"
  diff <(echo "$PREV_STATUS") <(echo "$CURR_STATUS") 2>/dev/null | grep '^[<>]' | head -10 || echo "  (diff unavailable)"
fi

echo ""
echo "Full diff:"
diff --unified=1 "$PREVIOUS" "$LATEST" 2>/dev/null | head -50 || echo "(no diff output)"
