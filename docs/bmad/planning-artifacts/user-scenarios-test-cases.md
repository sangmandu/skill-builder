---
stepsCompleted:
  - wf-plugin-scan
  - stateful-platform-test-matrix
inputDocuments:
  - docs/bmad/planning-artifacts/prd.md
  - docs/bmad/planning-artifacts/trd.md
workflowType: test-cases
projectName: skill-builder-cc
date: 2026-05-02
---

# User Scenarios & Test Cases - Skill Builder CC

## 1. 테스트 관점

이 문서는 Skill Builder를 "기존 스킬 시각화 도구"가 아니라 "상태관리형 skill platform builder"로 테스트한다.

Status:

- Current: 현재 앱에서 이미 가능한 동작
- Gap: 현재 일부 UI는 있으나 제품 목표와 다름
- Future: 이번 PRD/TRD 기준으로 구현해야 할 동작

## 2. 새 스킬 생성

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| NEW-001 | 앱이 빈 상태다 | 사용자가 New Stateful Skill을 선택한다 | skill name, trigger, runtime profile 입력 화면이 열린다 | Future |
| NEW-002 | 사용자가 skill name `release-helper`를 입력한다 | Create를 누른다 | thin `SKILL.md`와 기본 project model이 생성된다 | Future |
| NEW-003 | 기본 runtime profile이 선택됐다 | Create를 완료한다 | `run.sh`, `lib/*`, hook files가 platform_runtime asset으로 생성된다 | Future |
| NEW-004 | 새 스킬이 생성됐다 | UI가 project를 표시한다 | step, track, state schema, scripts 영역이 비어 있거나 starter 값으로 보인다 | Future |

## 3. Thin SKILL.md와 lazy loading

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| SKILL-001 | 새 skill project가 있다 | 사용자가 description과 trigger를 수정한다 | `SKILL.md` frontmatter/entrypoint가 갱신된다 | Current |
| SKILL-002 | 사용자가 step을 추가한다 | builder가 파일을 쓴다 | step markdown은 별도 파일로 생성되고 `SKILL.md`에는 모든 step 본문이 들어가지 않는다 | Current |
| SKILL-003 | step file이 많다 | agent가 skill을 실행한다 | runtime은 현재 step만 stdout으로 전달한다 | Current |
| SKILL-004 | helper가 always와 on_demand로 나뉜다 | step이 render된다 | always helper와 참조된 on_demand helper만 context에 포함된다 | Current |

## 4. Platform script와 user script 분리

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| SCR-001 | basic_stateful runtime이 선택됐다 | project가 생성된다 | `lib/init-workflow.sh`는 platform_runtime으로 표시된다 | Current |
| SCR-002 | basic_stateful runtime이 선택됐다 | project가 생성된다 | `lib/complete-step.sh`는 platform_runtime으로 표시된다 | Current |
| SCR-003 | user가 `scripts/release-notes.sh`를 추가한다 | role을 user_script로 선택한다 | script는 user-owned asset으로 표시된다 | Future |
| SCR-004 | user가 CI observer를 template에서 추가한다 | role을 workflow_utility로 선택한다 | step에서 참조 가능한 deterministic utility로 표시된다 | Future |
| SCR-005 | platform runtime upgrade가 가능하다 | preview를 연다 | platform_runtime만 교체 대상이고 user_script는 보존 대상으로 표시된다 | Current |
| SCR-006 | user_script와 platform_runtime이 같은 폴더에 있다 | validation을 실행한다 | path가 아니라 asset role 기준으로 분류된다 | Current |
| SCR-007 | 현재 앱으로 import한다 | scripts/lib 파일이 발견된다 | role 구분 없이 scripts 목록으로만 잡힌다 | Gap |
| SCR-008 | 현재 앱에서 export한다 | imported custom scripts가 있다 | user_script preserve policy가 적용된다 | Current |

## 5. Step 생성과 registry

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| STEP-001 | project가 열려 있다 | 사용자가 step `PLAN_RELEASE`를 추가한다 | step key가 registry에 추가된다 | Current |
| STEP-002 | step이 추가됐다 | builder가 FS sync한다 | `030-plan-release.md` 같은 step file이 생성된다 | Future |
| STEP-003 | step number가 030이다 | canvas를 본다 | Plan group에 표시된다 | Current |
| STEP-004 | track에서 step 순서를 바꾼다 | 실행 순서를 확인한다 | `track-steps.json` 배열 순서가 실행 순서다 | Current |
| STEP-005 | filename number와 track 순서가 다르다 | validation을 실행한다 | error가 아니라 "number is visual grouping"으로 처리된다 | Current |

## 6. Track 설계

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| TRK-001 | project가 있다 | 사용자가 `feature` track을 만든다 | track row와 canvas filter가 생성된다 | Current |
| TRK-002 | `feature`와 `fix` track이 있다 | 같은 step을 둘 다에 추가한다 | step은 두 track에 모두 포함된다 | Current |
| TRK-003 | `fix` track을 만든다 | reproduction step을 앞쪽에 둔다 | fix track은 reproduce/verify/report gate를 가진다 | Future |
| TRK-004 | `light` track을 만든다 | plan/test 일부 step을 제외한다 | light track은 짧은 실행 경로로 저장된다 | Future |
| TRK-005 | track 배열을 수정한다 | 이미 running 중인 state가 있다 | 진행 중 state의 step list는 자동 변경되지 않는다고 표시된다 | Current |

## 7. State schema

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| STATE-001 | runtime profile이 있다 | builder가 state schema를 보여준다 | `control.*`은 reserved로 표시된다 | Current |
| STATE-002 | user가 `ticket_id` data field를 추가한다 | 저장한다 | `data.ticket_id` default와 producing/consuming step이 기록된다 | Current |
| STATE-003 | user가 `control.current_step`을 직접 편집하려 한다 | 저장한다 | platform reserved error가 난다 | Current |
| STATE-004 | step이 `pr_number`를 생산한다 | step metadata를 설정한다 | downstream step에서 consumes 관계가 표시된다 | Current |
| STATE-005 | 현재 앱에서 workflow를 편집한다 | state schema를 찾는다 | state schema UI가 없다 | Closed |

## 8. No-question policy

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| AUTO-001 | Solo run step을 만든다 | step body에 "ask the user"를 입력한다 | validation warning이 표시된다 | Current |
| AUTO-002 | Solo run step이 실행 중이다 | agent가 응답을 끝내려 한다 | stop guard가 stop을 block한다 | Current |
| AUTO-003 | step이 완료됐다 | agent가 complete command를 실행한다 | 다음 step markdown이 즉시 출력된다 | Current |
| AUTO-004 | agent가 milestone summary만 하고 멈추려 한다 | stop guard가 실행된다 | workflow running이면 block된다 | Current |
| AUTO-005 | 현재 앱에서 execution mode를 Solo run으로 바꾼다 | 저장한다 | stop guard가 해당 step stop을 block한다 | Current |

## 9. Interrupt flow

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| INT-001 | step이 User involved다 | agent가 해당 step에서 멈추려 한다 | stop guard가 허용하되 interrupt state는 자동 변경하지 않는다 | Current |
| INT-002 | agent가 진짜 유저 판단이 필요하다 | `run.sh interrupt "<reason>"`을 실행한다 | state에 interrupt flag/reason이 기록된다 | Current |
| INT-003 | interrupt 상태다 | user가 답한다 | agent는 답변 처리 후 resume command를 실행한다 | Current |
| INT-004 | interrupt 상태가 끝났다 | resume이 실행된다 | current step markdown이 다시 출력된다 | Current |
| INT-005 | 현재 앱에서 step을 User involved 또는 Background wait로 바꾼다 | export한다 | stop guard non-blocking policy에 반영된다 | Current |
| INT-006 | workflow가 running 중이다 | user prompt hook이 실행된다 | hook context만 추가되고 interrupt state는 자동 변경되지 않는다 | Current |

## 10. Builder-as-a-skill

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| BAS-001 | Skill Builder skill이 설치되어 있다 | user가 builder skill을 실행한다 | local UI가 열린다 | Current |
| BAS-002 | builder UI가 열린다 | agent가 skill root를 전달한다 | UI가 해당 project를 로드한다 | Current |
| BAS-003 | user가 UI에서 step을 추가한다 | agent가 다음 메시지를 처리한다 | agent는 추가된 파일/registry를 같은 FS state에서 읽는다 | Current |
| BAS-004 | user가 agent에게 "fix track에 VERIFY 추가"라고 한다 | agent가 파일을 수정한다 | UI canvas가 watcher를 통해 즉시 갱신된다 | Current |

## 11. Live filesystem sync

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| FS-001 | UI에서 step title을 바꾼다 | debounce가 끝난다 | step file 또는 project model file이 갱신된다 | Current |
| FS-002 | Zed에서 step file을 수정한다 | watcher가 감지한다 | UI markdown editor가 갱신된다 | Current |
| FS-003 | UI와 Zed가 같은 파일을 동시에 바꾼다 | sync가 발생한다 | conflict UI가 표시된다 | Current |
| FS-004 | platform_runtime file이 외부에서 바뀐다 | validation을 실행한다 | runtime drift warning이 표시된다 | Future |
| FS-005 | user_script file이 외부에서 바뀐다 | sync가 발생한다 | user edit로 보존된다 | Current |
| FS-006 | 현재 앱에서 export를 누른다 | target dir에 쓴다 | 일회성 export는 가능하고 이후 bound project로 live sync된다 | Current |
| FS-007 | validation error가 있다 | autosync 또는 Sync를 시도한다 | write가 막히고 header에 blocked 상태가 표시된다 | Current |

## 12. Conversational editing

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| CHAT-001 | project가 열려 있다 | user가 "새 brainstorm track 만들어줘"라고 한다 | agent가 track, steps, canvas state를 갱신한다 | Current |
| CHAT-002 | user가 "이 step은 질문하면 안 돼"라고 한다 | agent가 execution mode를 Solo run으로 수정한다 | validation이 no-question rule을 적용한다 | Current |
| CHAT-003 | user가 "이 step은 꼭 내 확인을 받아"라고 한다 | agent가 execution mode를 User involved로 수정한다 | stop guard non-blocking policy가 갱신된다 | Current |
| CHAT-004 | user가 "릴리즈 노트 script 붙여"라고 한다 | agent가 user_script를 만든다 | step이 scriptRef를 가진다 | Current |
| CHAT-005 | 현재 앱만 사용한다 | agent 대화로 구조를 바꾼다 | UI watcher가 없어서 자동 반영되지 않는다 | Closed |

## 13. Canvas edge와 실행 의미

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| EDGE-001 | A group과 C group이 보인다 | user가 A group을 C group으로 연결한다 | edge meaning dialog가 열린다 | Current |
| EDGE-002 | A group과 C group이 연결됐다 | track을 전환한다 | semantic graph edge가 유지된다 | Current |
| EDGE-003 | user가 A group을 C group으로 연결한다 | builder가 의미 선택을 요청한다 | visual note / track reorder / dependency / branch 중 선택하게 한다 | Current |
| EDGE-004 | user가 track reorder 의미를 선택한다 | 저장한다 | `track-steps.json` 순서가 바뀐다 | Current |
| EDGE-005 | user가 dependency 의미를 선택한다 | 저장한다 | graph model에 semantic edge가 기록된다 | Current |
| EDGE-006 | user가 visual note 의미를 선택한다 | 저장한다 | 실행 순서는 바뀌지 않는다 | Current |

## 14. Generated skill runtime tests

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| RUN-001 | generated skill folder가 있다 | `run.sh init feature "task"`를 실행한다 | `.workflow/state.json`이 생성된다 | Current |
| RUN-002 | state가 생성됐다 | state를 확인한다 | 첫 step은 running, 나머지는 pending이다 | Current |
| RUN-003 | current step을 완료한다 | `run.sh complete <KEY>`를 실행한다 | current step은 completed, 다음 pending은 running이다 | Current |
| RUN-004 | workflow가 running이다 | `run.sh resume`을 실행한다 | 현재 running step markdown이 출력된다 | Current |
| RUN-005 | step body가 `helpers#git_rules`를 참조한다 | step render가 실행된다 | always helper와 git_rules helper가 출력된다 | Current |
| RUN-006 | 모든 step을 complete한다 | 마지막 complete가 실행된다 | state status는 completed다 | Current |

## 15. Validation tests

| ID | Given | When | Then | Status |
|---|---|---|---|---|
| VAL-001 | track에 missing step key가 있다 | validate한다 | error를 표시한다 | Current |
| VAL-002 | registry에 file missing이 있다 | validate한다 | error를 표시한다 | Current |
| VAL-003 | step이 unknown helper를 참조한다 | validate한다 | warning 또는 error를 표시한다 | Current |
| VAL-004 | step이 unknown script를 참조한다 | validate한다 | error를 표시한다 | Current |
| VAL-005 | Solo run step에 approval language가 있다 | validate한다 | execution warning을 표시한다 | Current |
| VAL-006 | platform runtime file이 누락됐다 | validate한다 | runtime error를 표시한다 | Current |
| VAL-007 | duplicate track name이 있다 | validate한다 | error를 표시한다 | Current |
| VAL-008 | duplicate helper key가 있다 | validate한다 | error를 표시한다 | Current |

## 16. End-to-end scenarios

### E2E-001 새 자동화 skill 생성

Given:

- 사용자가 Skill Builder를 연다.

When:

1. New Stateful Skill을 선택한다.
2. skill name과 trigger를 입력한다.
3. basic_stateful runtime을 선택한다.
4. feature track을 만든다.
5. SETUP, PLAN, IMPLEMENT, COMPLETE_REPORT step을 만든다.
6. 저장한다.

Then:

- thin `SKILL.md`가 있다.
- `step-registry.json`이 있다.
- `track-steps.json`이 있다.
- step markdown files가 있다.
- platform runtime assets가 있다.
- validation이 통과한다.

Status: Future

### E2E-002 대화로 fix track 확장

Given:

- feature track만 있는 project가 열려 있다.

When:

1. user가 "bug fix용 track도 만들어. 재현 확인 전에는 ticket 만들지 마"라고 한다.
2. agent가 INVESTIGATE, VERIFY, REPORT step을 만든다.
3. fix track을 만들고 앞쪽에 세 step을 배치한다.
4. REPORT를 User involved로 지정한다.

Then:

- fix track 실행 순서가 reproduction gate를 반영한다.
- REPORT는 stop guard non-blocking policy에 들어간다.
- UI canvas가 변경을 보여준다.

Status: Future

### E2E-003 자동 진행과 stop guard

Given:

- generated skill이 feature track으로 running 중이다.
- current step은 Solo run step이다.

When:

1. agent가 현재 step을 완료하지 않고 응답을 끝내려 한다.
2. stop guard가 실행된다.

Then:

- stop guard는 block decision을 반환한다.
- agent는 계속 작업하거나 complete/interrupt command를 실행해야 한다.

Status: Future

### E2E-004 user_script 보존

Given:

- user가 `scripts/release-notes.sh`를 user_script로 만들었다.
- platform runtime upgrade가 가능하다.

When:

1. user가 runtime upgrade preview를 연다.
2. upgrade를 적용한다.

Then:

- platform_runtime files는 새 버전으로 바뀐다.
- user_script는 바뀌지 않는다.
- 변경 summary가 role별로 표시된다.

Status: Future
