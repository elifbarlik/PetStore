# JMeter load test — `GET /api/post/GetAllPosts`

A small, **read-only** load profile against the public listing endpoint (the most-hit
endpoint: every visit to `/ilanlar` calls it). It needs no authentication and writes no
data, so it is safe to run against a local or test environment. It is **not** part of CI.

| Setting | Default | Override |
|---|---|---|
| Virtual users | 20 | `-Jthreads=50` |
| Ramp-up | 10 s | `-Jrampup=30` |
| Requests per user | 25 (→ 500 total) | `-Jloops=100` |
| Target | `localhost:5294` | `-Jhost=… -Jport=…` |

**Assertions per request:** HTTP 200 · JSON `$.isSuccess == true` · response time < 2000 ms.

Seed a realistic data set first (and remove it afterwards):

```bash
cd tests
node jmeter/seed-posts.mjs seed 50    # creates a user with 50 posts (state in jmeter/results/)
node jmeter/seed-posts.mjs clean      # deletes them again
```

## Run

Prerequisites: Java 17+ and [Apache JMeter 5.6+](https://jmeter.apache.org/download_jmeter.cgi) on `PATH`; backend running on port 5294.

```bash
cd tests/jmeter
jmeter -n -t GetAllPosts-load-test.jmx -l results/results.jtl -e -o results/html-report
```

`-n` runs headless, `-l` writes raw samples, `-e -o` generates JMeter's HTML dashboard
(`results/html-report/index.html`). The `results/` folder is git-ignored.

## Recording results

The latest results are in [`TEST_PLAN.md` §10](../TEST_PLAN.md#10-load-test-jmeter). To record a new run, copy the *Statistics* row for `GET /api/post/GetAllPosts` from the dashboard
(samples, error %, average, p90, p95, p99, throughput) into section 10 of
[`../TEST_PLAN.md`](../TEST_PLAN.md), together with the DB size (number of posts) and the
machine it ran on — `GetAllPosts` loads every post with its owner, so
latency grows with data volume.
