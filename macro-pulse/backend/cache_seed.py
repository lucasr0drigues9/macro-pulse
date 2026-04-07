import json, os
_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(_dir, "cache_seed.json")) as _f:
    SEED_DATA = json.load(_f)
