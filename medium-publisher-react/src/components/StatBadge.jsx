import React from 'react'

export default function StatBadge({ label, value }){
  return (
    <div style={{display:'inline-block',minWidth:110,marginRight:8}}>
      <div style={{background:'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',padding:10,borderRadius:10}}>
        <div style={{fontSize:12,color:'#94a3b8'}}>{label}</div>
        <div style={{fontWeight:700,fontSize:16}}>{value}</div>
      </div>
    </div>
  )
}
