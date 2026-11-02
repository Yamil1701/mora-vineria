export const WORKFLOW_PAGES=['inventory','opening','openingReview','inventoryCount','stockHistory','stockOperation','reviews','reviewDetail','debts','debtDetail','debtPayment','receiptPayment','partialCredit','correctionChoice','correctionForm','correctionReview','correctionDetail','reports','reportGoal','reportPrint'];
export const WORKFLOW_FIELDS=['workspaceDraft','workspaceFocusId','workspaceSearch','workspaceFiltersOpen','workspaceMoneyKind','workspaceMoneyFrom','workspaceMoneyTo','creditShare','reportPeriod','reportMonth','reportFrom','reportTo'];
export function finishWorkflowOperation(staged,op,result){
  const w=staged.workState;
  if(['opening','inventory-adjustment'].includes(op.kind))Object.assign(w,{page:'stockOperation',workspaceFocusId:op.id,workspaceDraft:null});
  if(op.kind==='resolve-stock')Object.assign(w,{page:'reviewDetail',workspaceFocusId:op.payload.reviewId,workspaceDraft:null});
  if(op.kind==='debt-payment')Object.assign(w,{page:'debtDetail',workspaceFocusId:op.payload.debtId,workspaceDraft:null});
  if(op.kind==='receipt-payment')Object.assign(w,{page:'receiptDetail',receiptId:result.receiptId,workspaceDraft:null});
  if(op.kind==='monthly-goal')Object.assign(w,{page:'reports',reportMonth:op.payload.month,reportPeriod:'month',workspaceDraft:null});
  if(op.kind==='sale-correction')Object.assign(w,{page:'correctionDetail',workspaceFocusId:op.id,workspaceDraft:null});
}
