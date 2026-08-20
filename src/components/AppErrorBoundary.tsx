import React from 'react';
export class AppErrorBoundary extends React.Component<{children:React.ReactNode},{hasError:boolean}>{
 state={hasError:false};
 static getDerivedStateFromError(){return {hasError:true};}
 componentDidCatch(error:unknown,info:React.ErrorInfo){console.error('Puthumai Uzhavan runtime error',error,info);}
 render(){if(!this.state.hasError)return this.props.children;return <main className="min-h-screen flex items-center justify-center p-6"><section className="max-w-md w-full rounded-2xl border p-6 text-center"><h1 className="text-xl font-semibold">Something went wrong</h1><p className="mt-2 text-sm opacity-75">Please reload and try again.</p><button className="mt-5 rounded-xl border px-4 py-3" onClick={()=>location.reload()}>Reload</button></section></main>;}
}
