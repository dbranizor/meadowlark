export const writable = (initial_value = 0) => {

    let value = initial_value         // content of the store
    let subs = []                     // subscriber's handlers
  
    const subscribe = (handler) => {
      subs = [...subs, handler]                                 // add handler to the array of subscribers
      handler(value)                                            // call handler with current value
      return () => subs = subs.filter(sub => sub !== handler)   // return unsubscribe function
    }
  
    const set = (new_value) => {
      console.log('dingo store Checking Value', new_value)
      if (JSON.stringify(value) === JSON.stringify(new_value)) {
        console.log('dingo currRecords added to store same value NOT', new_value, value)
        return;
      }         // same value, exit
      value = new_value                       // update value
      console.log('dingo store telling subs value is updated', value)
      subs.forEach(sub => sub(value))         // update subscribers
    }
  
    const update = (update_fn) => {
      console.log('dingo updating')
      set(update_fn(value));
    }   // update function
  
    return { subscribe, set, update }       // store contract
  }