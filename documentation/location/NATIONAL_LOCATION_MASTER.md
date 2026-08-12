# National Location Master

**Product version:** 1.8.0  
**Language:** British English

## Hierarchy

```
Country (Ghana)
 └─ Region (16)
     └─ MMDA (261)
         └─ Sub-District Unit (optional; STMA today)
             └─ Electoral Area (optional; STMA today)
                 └─ Community / Suburb / Neighbourhood
                     └─ Street / Landmark (free text)
```

## Dataset authority

| Level | Authority in WILMS |
|-------|--------------------|
| Region / MMDA | IMCCOD register |
| Sub-district / electoral | STMA publications (national gazetteers pending) |
| Community | IMCCOD capitals + HOTOSM named places + STMA + bundled seed |

## Key migration

`0043_v180_national_locality_intelligence` — aliases, GIS-ready columns, data-quality run log.
